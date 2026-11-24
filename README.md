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

## Admin
Le compte admin principal vient **uniquement** de `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) : il est créé / resynchronisé à chaque démarrage (l'ancien compte par défaut est remplacé). Il n'y a plus aucun mot de passe par défaut dans le code.
D'autres admins s'ajoutent depuis la page `/admin` (carte **Admins**, mot de passe ≥ 12 caractères).

## Sécurité
- **Production** : mets `ENVIRONMENT=production`. Le serveur refuse de démarrer si `SECRET_KEY` est faible (< 32 caractères / valeur par défaut) ou si `ADMIN_PASSWORD` est un mot de passe par défaut. Génère une clé : `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`.
- **Session** : le JWT est dans un cookie `HttpOnly` (+ `Secure` en production, `SameSite=Lax`) ; le front ne garde qu'un jeton CSRF en mémoire (`X-CSRF-Token`). En production, front et API doivent être sur le même *site* (ex. `app.exemple.dz` et `api.exemple.dz`) et `CORS_ORIGINS` doit contenir l'URL exacte du front.
- **Login** : limitation des tentatives (5 échecs / e-mail, 20 / IP, blocage progressif 30 s → 15 min, réponse 429 + journal `security`). Compteurs en mémoire, par processus. Derrière un reverse proxy, mets `TRUST_PROXY_HEADERS=true`.
- **CSV** : les cellules commençant par `= + - @` sont neutralisées (injection de formules Excel).
- **E-mails** : un message privé par destinataire, envoyé depuis l'adresse admin, via une file durable (`email_outbox`) avec réessais automatiques (backoff) ; la carte « E-mail queue » de `/admin` permet de relancer les échecs.
- **Capacité** : impossible de la descendre sous le nombre d'équipes déjà inscrites (non refusées).

## Jour J : scanner QR
Page `/admin` → carte **Event-day check-in** : caméra (HTTPS ou `localhost` obligatoire) ou saisie manuelle du code `TLP-XXXXXX`. Seules les équipes **acceptées** peuvent entrer ; un second scan affiche « Already checked in » ; « Undo » annule une erreur. Le compteur *Checked in* et l'export CSV (`checked_in_at`) sont mis à jour.

## Pages
`/` · `/about` · `/tracks` (= **Event** : 3 volets + livrables) · `/schedule` (**Choix 2** encadré 08:30–20:00) · `/prizes` · `/faq` · `/register` · `/login` · `/dashboard` · `/admin`

Logos : `frontend/public/logo.webp` (CYWORK, bouclier — navbar/footer/favicon) et `frontend/public/logo-48.webp` (THE LAST PROTOCOL "48" — héros de l'accueil uniquement).

## Inscription par équipe + notifications
- Une équipe (3 à 5 personnes) s'inscrit **en une fois** : étape A équipe + chef, étape B Gmail des 2 à 4 autres membres, étape C infos optionnelles. (Plus de "find team" / codes d'invitation.)
- Quand l'admin **accepte / refuse** une équipe : e-mail envoyé au chef **et** à chaque Gmail de membre, et le statut s'affiche sur `/dashboard` (rafraîchi toutes les 30 s).
- E-mails : envoyés depuis l'**adresse admin** (`ADMIN_EMAIL`, sauf si `MAIL_FROM` est défini) ; il faut `SMTP_PASSWORD` = mot de passe d'application Google de ce compte. Renseigne `SMTP_*` et `SITE_URL` dans `backend/.env` (Gmail : valider en 2 étapes puis créer un « mot de passe d'application »). Sans `SMTP_HOST`, les e-mails sont seulement écrits dans les logs d'uvicorn.
- Compte à rebours : lancement mardi 15 décembre 2026 à 10:00 (UTC+1) — `frontend/components/Countdown.tsx`.

Transitions entre pages: `components/PageTransition.tsx` (wipe + logo) et animations dans `app/globals.css`.
Pour naviguer avec l'animation en code, utilise `useNavigate()` au lieu de `router.push()`.

## Mise à jour de la base (téléphone supprimé)
`sudo -u postgres psql -d hackathon -f backend/migrations_manual.sql` (ou redémarre simplement `uvicorn`, la colonne `users.phone` est supprimée automatiquement).

## Migrations (production)
La migration initiale existe (`backend/alembic/versions/0001_initial.py`). En `ENVIRONMENT=production`, l'application **ne crée plus** les tables toute seule :
```bash
cd backend && alembic upgrade head
# après chaque modification de modèle :
alembic revision --autogenerate -m "description" && alembic upgrade head
```
Base de dev déjà existante (créée par `create_all`) : `alembic stamp 0001_initial` (après avoir ajouté les colonnes `users.checked_in_at/checked_in_by` — fait automatiquement par `uvicorn` en développement).
