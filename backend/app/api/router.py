from fastapi import APIRouter

from app.api import admin, auth, public, teams, users

api_router = APIRouter(prefix="/api")
for r in (auth.router, users.router, teams.router, public.router, admin.router):
    api_router.include_router(r)
