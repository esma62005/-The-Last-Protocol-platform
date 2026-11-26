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
Tables + compte admin créés au premier démarrage.

> ⚠️ Le modèle de données a changé (inscription **par équipe**, plus de `track` / code d'équipe). Si tu as déjà une base de test :
> `sudo -u postgres psql -c "DROP DATABASE hackathon;" -c "CREATE DATABASE hackathon OWNER hackathon;"` puis relance `uvicorn`. Swagger: http://localhost:8000/docs — tests: `pytest`.

## 3. Frontend (http://localhost:3000)
```bash
cd frontend
cp .env.example .env.local
npm install && npm run dev
```
