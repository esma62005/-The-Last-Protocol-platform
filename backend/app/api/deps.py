import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import csrf_matches, decode_token
from app.db.session import get_db
from app.models import Role, User

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def _claims(request: Request) -> dict:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated.")
    try:
        claims = decode_token(token)
        claims["sub"]
    except (jwt.PyJWTError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    # cookie-authenticated requests that change data must prove they come from our own front-end
    if request.method not in SAFE_METHODS and not csrf_matches(claims, request.headers.get("x-csrf-token")):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF check failed.")
    return claims


def current_claims(request: Request) -> dict:
    return _claims(request)


def current_user(claims: dict = Depends(current_claims), db: Session = Depends(get_db)) -> User:
    user = db.get(User, claims["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")
    return user


def admin_only(user: User = Depends(current_user)) -> User:
    if user.role != Role.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required.")
    return user
