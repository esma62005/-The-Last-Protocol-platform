# The Last Protocol – CYWORK Hackathon Platform

Stack: **Next.js 14 (React · TypeScript · Tailwind)** · **FastAPI** · **PostgreSQL** · **SQLAlchemy 2**

## 0. Prérequis (Ubuntu)
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib python3-venv python3-pip
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo systemctl enable --now postgresql
```

## 1. Base de données
```bash
sudo -u postgres psql
```
```sql
CREATE USER hackathon WITH PASSWORD 'hackathon';
CREATE DATABASE hackathon OWNER hackathon;
\q
```

## 2. Backend (http://localhost:8000)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Tables + compte admin créés au premier démarrage. Swagger: http://localhost:8000/docs — tests: `pytest`.

## 3. Frontend (http://localhost:3000)
```bash
cd frontend
cp .env.example .env.local
npm install && npm run dev
```

## Admin (seed)
`admin@cywork.dz` / `admin2049` — à changer dans `backend/.env`.

## Pages
`/` · `/about` · `/tracks` · `/schedule` · `/prizes` · `/faq` · `/register` · `/login` · `/dashboard` · `/teams` · `/admin`

Logo: `frontend/public/logo.webp` (transparent) + favicon `frontend/app/icon.png`.

Transitions entre pages: `components/PageTransition.tsx` (wipe + logo) et animations dans `app/globals.css`.
Pour naviguer avec l'animation en code, utilise `useNavigate()` au lieu de `router.push()`.

## Migrations (production)
```bash
cd backend && alembic revision --autogenerate -m "init" && alembic upgrade head
```
Puis retire `Base.metadata.create_all` de `app/main.py`.
