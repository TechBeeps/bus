# Bus Monorepo

This repository contains a backend FastAPI service for QR-based bus ticketing and models.

Quick start:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API:
- Health: `GET /`
- Create ticket: `POST /api/v1/tickets/create`
- Payment webhook: `POST /api/v1/payments/webhook`

Notes:
- Adjust `allow_origins` in `backend/main.py` for production.
- Add a database and update `backend/app/models/schema.py` for persistence.
