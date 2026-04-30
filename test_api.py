#!/usr/bin/env python
"""Simple test script to verify the API works"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test the API
response = client.get("/api/reports?limit=1")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
