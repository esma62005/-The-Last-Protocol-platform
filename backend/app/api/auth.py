import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_claims
from app.core.config import settings
from app.core.security import burn_password_check, create_token, verify_password
from app.core.throttle import client_ip, throttle
from app.db.session import get_db
from app.models import User
from app.schemas import LoginIn, RegisterIn, TokenOut
from app.services.mailer import queue_registration
from app.services.registration import register_user

router = APIRouter(prefix="/auth", tags=["auth"])
sec_log = logging.getLogger("security")


def _session(user: User, response: Response) -> TokenOut:
    token, csrf = create_token(user.id, user.role.value)
    response.set_cookie(settings.cookie_name, token, max_age=settings.access_token_minutes * 60, httponly=True,
                        secure=settings.cookie_secure, samesite=settings.cookie_samesite, path="/")
    return TokenOut(role=user.role.value, user_id=user.id, csrf_token=csrf)


@router.post("/register", response_model=TokenOut, status_code=201)
def register(data: RegisterIn, response: Response, db: Session = Depends(get_db)):
    user = register_user(db, data)
    queue_registration(db, user)
    return _session(user, response)


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    email = data.email.lower()
    keys = (f"ip:{client_ip(request)}", f"email:{email}")
    wait = throttle.retry_after(*keys)
    if wait:
        sec_log.warning("Login blocked (rate limit) email=%s ip=%s retry_in=%ss", email, keys[0][3:], wait)
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Too many attempts. Try again in {wait} seconds.",
                            headers={"Retry-After": str(wait)})
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        burn_password_check(data.password)  # same response time whether or not the account exists
    if not user or not verify_password(data.password, user.password_hash):
        throttle.fail(*keys)
        sec_log.warning("Failed login email=%s ip=%s", email, keys[0][3:])
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials.")
    throttle.success(*keys)
    if user.role.value == "admin":
        sec_log.info("Admin login: %s from %s", email, keys[0][3:])
    return _session(user, response)


@router.get("/session", response_model=TokenOut)
def session(response: Response, claims: dict = Depends(current_claims)):
    """Lets the front-end recover its CSRF value after a page reload (the JWT cookie is invisible to JavaScript)."""
    return TokenOut(role=claims["role"], user_id=claims["sub"], csrf_token=claims["csrf"])


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/", secure=settings.cookie_secure,
                           httponly=True, samesite=settings.cookie_samesite)
