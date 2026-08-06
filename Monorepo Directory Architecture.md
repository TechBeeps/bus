bus-ticketing-platform/           # Git Root Directory
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml        # Python FastAPI testing & Docker build
│   │   ├── passenger-ci.yml      # React Web-App build & deploy (Vercel/S3)
│   │   └── conductor-ci.yml      # React Native Android APK build
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .gitignore                    # Global git ignore (secrets, venv, node_modules)
├── README.md                     # Comprehensive agency docs & deployment guide
├── docker-compose.yml            # Local development environment spinner
│
├── backend/                      # Python FastAPI Service
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── passenger-webapp/             # React Passenger Web-App (PWA)
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── conductor-mobile/             # React Native Android Conductor App
│   ├── android/
│   ├── src/
│   └── package.json
│
└── admin-dashboard/              # React Owner/Admin Panel
    ├── src/
    └── package.json