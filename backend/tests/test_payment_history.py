import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.models.schema import Payment
from fastapi.testclient import TestClient
from datetime import datetime

client = TestClient(app)

def test_payment_model_has_conductor_fields():
    # Verify Payment model columns exist
    assert hasattr(Payment, "conductor_id")
    assert hasattr(Payment, "bus_number")
    assert hasattr(Payment, "payment_mode")


def test_conductor_payment_history_today():
    res = client.get("/api/v1/conductor/payment-history?conductor_id=COND-01")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor_id"] == "COND-01"
    assert "total_amount" in data
    assert "total_tickets" in data
    assert "tickets" in data
    assert "buses_covered" in data
    assert isinstance(data["tickets"], list)


def test_conductor_payment_history_past_date():
    res = client.get("/api/v1/conductor/payment-history?conductor_id=COND-01&date=2026-08-21")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor_id"] == "COND-01"
    assert data["date"] == "2026-08-21"
    assert isinstance(data["tickets"], list)


def test_conductor_payment_history_invalid_conductor():
    res = client.get("/api/v1/conductor/payment-history?conductor_id=INVALID_COND_999")
    assert res.status_code == 404
