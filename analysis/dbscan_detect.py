# analysis/dbscan_detect.py
import sqlite3
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

DB_PATH = "disease_radar.db"   # relative to project folder

def load_reports():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT id, cell, created_at FROM reports", conn)
    conn.close()
    return df

def cell_to_coords(cell):
    # expect "cell_i_j" or "cellX_Y" fallback
    try:
        parts = cell.split("_")
        if len(parts) >= 3:
            return float(parts[1]), float(parts[2])
        # try detecting digits inside string
        nums = [int(s) for s in parts if s.isdigit()]
        if len(nums) >= 2:
            return float(nums[0]), float(nums[1])
    except Exception:
        pass
    return 0.0, 0.0

def run_dbscan(coords, eps=1.5, min_samples=10):
    # coords: Nx2 numpy array (grid indices)
    model = DBSCAN(eps=eps, min_samples=min_samples)
    labels = model.fit_predict(coords)
    return labels

def main():
    df = load_reports()
    if df.empty:
        print("No reports found. Generate synthetic data first or add reports.")
        return

    # map cell -> coords
    coords = np.array([cell_to_coords(c) for c in df['cell']])
    # run DBSCAN
    labels = run_dbscan(coords, eps=1.5, min_samples=10)
    df['cluster'] = labels

    # show summary
    total_clusters = len(set([l for l in labels if l != -1]))
    noise_count = int((labels == -1).sum())
    print(f"Total reports: {len(df)}")
    print(f"Clusters found (excluding noise): {total_clusters}")
    print(f"Noise points (not in any cluster): {noise_count}\n")

    # cluster sizes
    clustered = df[df['cluster'] != -1]
    if clustered.empty:
        print("No clusters detected with current DBSCAN settings.")
        return

    cluster_counts = clustered.groupby('cluster').size().reset_index(name='count').sort_values('count', ascending=False)
    print("Top clusters (cluster_id : count):")
    print(cluster_counts.to_string(index=False))

    # show cells in top cluster
    top_cluster = int(cluster_counts.iloc[0]['cluster'])
    top_cells = df[df['cluster'] == top_cluster]['cell'].unique().tolist()
    print(f"\nTop cluster id: {top_cluster}")
    print("Cells in top cluster:", top_cells)

    # optional: save CSV with cluster assignments
    out_csv = "analysis/clustered_reports.csv"
    df.to_csv(out_csv, index=False)
    print(f"\nSaved clustered records to: {out_csv}")

if __name__ == "__main__":
    main()
