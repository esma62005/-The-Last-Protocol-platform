import hmac
import secrets
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

ALGO = "HS256"
# bcrypt hash of a random string: used to burn the same time when the e-mail does not exist
_DUMMY_HASH = bcrypt.hashpw(secrets.token_bytes(16), bcrypt.gensalt()).decode()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except ValueError:
        return False


def burn_password_check(pw: str) -> None:
    verify_password(pw, _DUMMY_HASH)


def create_token(user_id: str, role: str) -> tuple[str, str]:
    """Returns (jwt, csrf_token). The CSRF value is embedded in the JWT and must be echoed in X-CSRF-Token."""
    csrf = secrets.token_urlsafe(24)
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    token = jwt.encode({"sub": user_id, "role": role, "csrf": csrf, "exp": exp}, settings.secret_key, ALGO)
    return token, csrf


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGO])


def csrf_matches(claims: dict, header: str | None) -> bool:
    return bool(header) and hmac.compare_digest(str(claims.get("csrf", "")), header)


def new_code(prefix: str = "TLP") -> str:
    """TLP-XXXXXX : used for user ticket IDs and team invitation codes."""
    alphabet = string.ascii_uppercase + string.digits
    return f"{prefix}-" + "".join(secrets.choice(alphabet) for _ in range(6))
