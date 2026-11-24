from fastapi import APIRouter

from app.api import admin, auth, public, users

api_router = APIRouter(prefix="/api")
for r in (auth.router, users.router, public.router, admin.router):
    api_router.include_router(r)
