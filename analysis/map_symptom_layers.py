# analysis/map_symptom_layers.py
"""
Generate a Folium map with one toggleable layer per symptom found in DB.
Outputs: analysis/map_symptom_layers.html
"""

import sqlite3
import pandas as pd
import folium
from folium.plugins import HeatMap
import numpy as np
import branca.colormap as cm
import os

DB_PATH = "disease_radar.db"
OUT_FILE = "analysis/map_symptom_layers.html"

# map grid -> lat/lon (same simple mapping used before)
def cell_to_latlon(cell):
    base_lat, base_lon = 12.96, 77.59
    try:
        _, i, j = cell.split("_")
        i, j = int(i), int(j)
        return base_lat + i * 0.002, base_lon + j * 0.002
    except:
        return base_lat, base_lon

# ---------------------------------------------------
# Load data
# ---------------------------------------------------
if not os.path.exists(DB_PATH):
    print("Database not found:", DB_PATH)
    raise SystemExit

conn = sqlite3.connect(DB_PATH)
df = pd.read_sql_query("SELECT id, symptoms, cell, onset_date, created_at FROM reports", conn)
conn.close()

if df.empty:
    print("No reports found in DB. Generate synthetic data or submit reports first.")
    raise SystemExit

# Normalize symptom strings -> lists (lowercase)
def parse_symptoms(s):
    if not s:
        return []
    if isinstance(s, str):
        return [x.strip().lower() for x in s.split(",") if x.strip()]
    return s

df['symptom_list'] = df['symptoms'].apply(parse_symptoms)

# Build the set of all symptoms (sorted by frequency)
all_symptoms = {}
for lst in df['symptom_list']:
    for s in lst:
        all_symptoms[s] = all_symptoms.get(s, 0) + 1

# Sort by frequency descending
symptoms_sorted = sorted(all_symptoms.items(), key=lambda x: -x[1])
symptom_names = [s for s, _ in symptoms_sorted]

if not symptom_names:
    print("No symptoms parsed from DB.")
    raise SystemExit

print("Symptoms found (by frequency):", symptom_names)

# ---------------------------------------------------
# Create base map
# ---------------------------------------------------
# Weighted center by total reports per cell
agg_all = df.groupby('cell').size().reset_index(name='cnt')
agg_all[['lat','lon']] = agg_all['cell'].apply(lambda c: pd.Series(cell_to_latlon(c)))
avg_lat = (agg_all['lat'] * agg_all['cnt']).sum() / agg_all['cnt'].sum()
avg_lon = (agg_all['lon'] * agg_all['cnt']).sum() / agg_all['cnt'].sum()

m = folium.Map(location=[avg_lat, avg_lon], zoom_start=13, tiles='OpenStreetMap')

# global colormap to color markers by count magnitude per-symptom
global_max = max(all_symptoms.values())
global_colormap = cm.linear.YlOrRd_09.scale(0, max(1, global_max))
global_colormap.caption = "Symptom count (per cell)"

# Add base all-reports heatmap (low-opacity)
heat_data = agg_all[['lat','lon','cnt']].values.tolist()
HeatMap(heat_data, radius=20, blur=12, max_zoom=13, min_opacity=0.2).add_to(m)

# ---------------------------------------------------
# For each symptom create a FeatureGroup (layer)
# - Marker cluster could be added, but for clarity we use circle markers and a small heatmap
# ---------------------------------------------------
for sym in symptom_names:
    fg = folium.FeatureGroup(name=f"Symptom: {sym}", show=False)
    # Filter reports that include this symptom
    sub = df[df['symptom_list'].apply(lambda lst: sym in lst)].copy()
    if sub.empty:
        # still add empty layer so user can toggle
        m.add_child(fg)
        continue

    # Aggregate by cell
    agg = sub.groupby('cell').size().reset_index(name='cnt')
    agg[['lat','lon']] = agg['cell'].apply(lambda c: pd.Series(cell_to_latlon(c)))
    max_cnt = agg['cnt'].max()

    # Add a small heatmap for this symptom to the layer using reduced opacity
    heat = agg[['lat','lon','cnt']].values.tolist()
    HeatMap(heat, radius=18, blur=10, max_zoom=13, min_opacity=0.3).add_to(fg)

    # Add circle markers (size by count, color by global colormap)
    for _, row in agg.iterrows():
        lat, lon, cnt, cell = row['lat'], row['lon'], int(row['cnt']), row['cell']
        color = global_colormap(cnt)
        folium.CircleMarker(
            location=(lat, lon),
            radius=4 + np.log1p(cnt) * 2,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.9,
            popup=folium.Popup(f"<b>{cell}</b><br/>{sym}: {cnt} reports", max_width=260)
        ).add_to(fg)

    # Add the feature group to the map
    m.add_child(fg)

# ---------------------------------------------------
# Add legend and layer control
# ---------------------------------------------------
m.add_child(global_colormap)
folium.LayerControl(collapsed=False).add_to(m)

# Save
os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
m.save(OUT_FILE)
print("Saved symptom-layer map to:", OUT_FILE)
print("Open the file in your browser and use the LayerControl (top-right) to toggle symptoms.")
