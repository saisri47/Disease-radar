# analysis/generate_alerts.py
"""
Alert generator for Disease Radar prototype.

What it does:
- Loads reports from local SQLite DB (disease_radar.db)
- Filters reports to last N hours (default 48)
- Runs DBSCAN on cell-grid coordinates to find clusters
- If any cluster has count >= ALERT_THRESHOLD, writes analysis/alerts.json
  with details and prints the alert.

How to run:
    python analysis\generate_alerts.py

Tune parameters below: ALERT_THRESHOLD, HOURS_WINDOW, DBSCAN_EPS, DBSCAN_MIN_SAMPLES
"""

import sqlite3
import pandas as pd
import numpy as np
import json
from sklearn.cluster import DBSCAN
from datetime import datetime, timedelta
import os
import smtplib
from email.message import EmailMessage

# ----- CONFIG -----
DB_PATH = "disease_radar.db"
OUT_ALERT_FILE = "analysis/alerts.json"

# detection window (last N hours)
HOURS_WINDOW = 48

# DBSCAN parameters (tweak for your grid)
DBSCAN_EPS = 1.0         # tighter cluster = smaller eps
DBSCAN_MIN_SAMPLES = 5

# Alert threshold (number of reports in cluster in the window)
ALERT_THRESHOLD = 30

# OPTIONAL: email alerts (disabled by default)
EMAIL_ALERTS = False
EMAIL_CONFIG = {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "from_addr": "your.email@gmail.com",
    "to_addrs": ["recipient@example.com"],
    # If using Gmail, use an app password and not your normal password.
    "username": "your.email@gmail.com",
    "password": "YOUR_SMTP_PASSWORD_OR_APP_PASSWORD"
}
# ------------------

def cell_to_coords(cell):
    # expecting "cell_i_j"
    try:
        _, i, j = cell.split("_")
        return float(i), float(j)
    except Exception:
        return 0.0, 0.0

def send_email_alert(subject, body):
    if not EMAIL_ALERTS:
        return False
    try:
        cfg = EMAIL_CONFIG
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = cfg["from_addr"]
        msg["To"] = ", ".join(cfg["to_addrs"])
        msg.set_content(body)
        with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"]) as s:
            s.starttls()
            s.login(cfg["username"], cfg["password"])
            s.send_message(msg)
        return True
    except Exception as e:
        print("Email send failed:", e)
        return False

def main():
    if not os.path.exists(DB_PATH):
        print("DB not found:", DB_PATH)
        return

    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT id, cell, symptoms, onset_date, created_at FROM reports", conn)
    conn.close()

    if df.empty:
        print("No reports in DB.")
        return

    # ensure created_at datetime
    df['created_at'] = pd.to_datetime(df['created_at'])
    cutoff = pd.Timestamp.now() - pd.Timedelta(hours=HOURS_WINDOW)
    recent = df[df['created_at'] >= cutoff].copy()
    print(f"Reports in last {HOURS_WINDOW} hours: {len(recent)}")

    if recent.empty:
        print("No recent reports in the window. No alerts.")
        # remove previous alert if present?
        if os.path.exists(OUT_ALERT_FILE):
            os.remove(OUT_ALERT_FILE)
        return

    # build coordinate matrix from cell names
    coords = np.array([cell_to_coords(c) for c in recent['cell']])
    # Run DBSCAN
    model = DBSCAN(eps=DBSCAN_EPS, min_samples=DBSCAN_MIN_SAMPLES)
    labels = model.fit_predict(coords)
    recent['cluster'] = labels

    # find clusters (exclude noise label -1)
    clusters = recent[recent['cluster'] != -1].groupby('cluster').size().reset_index(name='count')
    if clusters.empty:
        print("No clusters detected in recent window.")
        # remove previous alert if present?
        if os.path.exists(OUT_ALERT_FILE):
            os.remove(OUT_ALERT_FILE)
        return

    # sort clusters by size descending
    clusters = clusters.sort_values('count', ascending=False)
    alerts = []
    for _, row in clusters.iterrows():
        cid = int(row['cluster'])
        cnt = int(row['count'])
        if cnt >= ALERT_THRESHOLD:
            cluster_rows = recent[recent['cluster'] == cid]
            cells = sorted(cluster_rows['cell'].unique().tolist())
            symptoms_agg = cluster_rows['symptoms'].dropna().astype(str).tolist()
            # build simple symptom frequency
            sym_list = []
            for s in symptoms_agg:
                for item in s.split(","):
                    item = item.strip()
                    if item:
                        sym_list.append(item)
            sym_freq = {}
            for s in sym_list:
                sym_freq[s] = sym_freq.get(s, 0) + 1
            alert = {
                "detected_at": str(datetime.now()),
                "cluster_id": cid,
                "count": cnt,
                "cells": cells,
                "symptom_counts": sym_freq,
                "window_hours": HOURS_WINDOW,
                "dbscan": {"eps": DBSCAN_EPS, "min_samples": DBSCAN_MIN_SAMPLES},
                "threshold": ALERT_THRESHOLD
            }
            alerts.append(alert)

    if not alerts:
        print("No clusters exceed the alert threshold.")
        # remove previous alert file if existed
        if os.path.exists(OUT_ALERT_FILE):
            os.remove(OUT_ALERT_FILE)
        return

    # Save alerts file (single or multiple alerts)
    payload = {"alerts": alerts, "generated_at": str(datetime.now())}
    os.makedirs(os.path.dirname(OUT_ALERT_FILE), exist_ok=True)
    with open(OUT_ALERT_FILE, "w") as f:
        json.dump(payload, f, indent=2)
    print("ALERTS GENERATED! Saved to", OUT_ALERT_FILE)
    for a in alerts:
        print(f"ALERT: cluster {a['cluster_id']} count={a['count']} cells={a['cells']}")
        # pretty print top symptoms
        top_sym = sorted(a['symptom_counts'].items(), key=lambda x: -x[1])[:5]
        print(" Top symptoms:", top_sym)

    # Optionally send email
    if EMAIL_ALERTS:
        subject = f"Disease Radar Alert: {len(alerts)} cluster(s) detected"
        body = json.dumps(payload, indent=2)
        ok = send_email_alert(subject, body)
        print("Email alert sent:", ok)

if __name__ == "__main__":
    main()
