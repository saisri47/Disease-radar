#!/usr/bin/env python
"""Test database query"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from main import SessionLocal, ReportDB
import json

db = SessionLocal()
try:
    rows = db.query(ReportDB).order_by(ReportDB.created_at.desc()).limit(1).all()
    if rows:
        r = rows[0]
        result = {
            "id": r.id,
            "symptoms": r.symptoms.split(",") if r.symptoms else [],
            "cell": r.cell,
            "pincode": r.pincode,
            "onset_date": str(r.onset_date),
            "created_at": str(r.created_at)
        }
        print(json.dumps(result, indent=2))
    else:
        print("No reports found")
finally:
    db.close()
