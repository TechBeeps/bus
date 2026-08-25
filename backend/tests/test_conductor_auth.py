import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_conductor_login_with_mobile():
    res = client.post("/api/v1/conductor/login", json={
        "identifier": "9876543210",
        "password": "1234"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor"]["name"] == "Rajesh Kumar"
    assert data["conductor"]["mobile"] == "9876543210"
    assert data["conductor"]["assigned_bus_id"] == "BUS001"
    assert data["assigned_bus"] is not None
    assert data["assigned_bus"]["bus_id"] == "BUS001"


def test_conductor_login_with_email():
    res = client.post("/api/v1/conductor/login", json={
        "identifier": "suresh@bus.com",
        "password": "123456"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor"]["name"] == "Suresh Verma"
    assert data["conductor"]["assigned_bus_id"] == "BUS003"
    assert data["assigned_bus"] is not None
    assert data["assigned_bus"]["bus_id"] == "BUS003"


def test_conductor_login_invalid_password():
    res = client.post("/api/v1/conductor/login", json={
        "identifier": "9876543210",
        "password": "wrongpassword"
    })
    assert res.status_code == 401


def test_conductor_login_unassigned_bus():
    # COND-03 has assigned_bus_id = None
    res = client.post("/api/v1/conductor/login", json={
        "identifier": "9876543212",
        "password": "123456"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor"]["name"] == "Amit Singh"
    assert data["assigned_bus"] is None


def test_conductor_my_bus():
    res = client.get("/api/v1/conductor/my-bus/COND-01")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["conductor"]["conductor_id"] == "COND-01"
    assert data["assigned_bus"]["bus_id"] == "BUS001"
