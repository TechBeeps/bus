from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    r = client.get('/')
    assert r.status_code == 200
    assert 'status' in r.json()
