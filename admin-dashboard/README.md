# Admin Dashboard (local)

Quick helper to run the admin dashboard and a local mock API.

Install deps:

```bash
cd admin-dashboard
npm install
```

Run the mock API (json-server) on port 8000:

```bash
npm run mock
```

Start the React dev server:

```bash
npm start
```

The UI reads `REACT_APP_API_URL` from `.env` (defaults to `http://localhost:8000/api/v1`). json-server exposes resources at `/buses`, `/conductors`, `/routes`.
