import random
from datetime import date, timedelta
import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/report"

# Our grid cells (10 x 10 grid)
cells = [f"cell_{i}_{j}" for i in range(10) for j in range(10)]
symptom_pool = ["cough", "fever", "sore_throat", "headache", "fatigue"]

# hotspot cluster location
cluster_cell = "cell_4_5"

def send(report):
    try:
        r = requests.post(BASE_URL, json=report, timeout=5)
        print("Sent:", r.status_code, report)
        return r.status_code
    except Exception as e:
        print("Error:", e)
        return None

# simulate 7 days of data
for day_offset in range(7):
    d = date.today() - timedelta(days=day_offset)

    # baseline reports (random noise)
    for _ in range(20):
        r = {
            "symptoms": random.sample(symptom_pool, k=random.choice([1,2])),
            "cell": random.choice(cells),
            "onset_date": str(d)
        }
        send(r)
        time.sleep(0.02)

    # hotspot cluster (cases concentrated in one cell)
    for _ in range(40 + day_offset * 5):  # increasing each day
        r = {
            "symptoms": random.sample(symptom_pool, k=random.choice([1,2,3])),
            "cell": cluster_cell,
            "onset_date": str(d)
        }
        send(r)
        time.sleep(0.02)

print("Synthetic data generation complete.")
