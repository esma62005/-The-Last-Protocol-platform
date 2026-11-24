import logging
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

log = logging.getLogger("config")

# Values that must never reach production (old defaults + the placeholders of .env.example).
_KNOWN_WEAK = {"dev-secret-change-me", "admin2049", "admin", "password", "123456", "12345678"}


def _is_placeholder(value: str) -> bool:
    v = value.strip().lower()
    return not v or v in _KNOWN_WEAK or v.startswith("change")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "production"] = "development"
    database_url: str = "postgresql+psycopg2://hackathon:hackathon@localhost:5432/hackathon"
    secret_key: str = "dev-secret-change-me"
    access_token_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:3000"

    # Bootstrap admin: no built-in default any more, it must come from .env
    admin_email: str = ""
    admin_password: str = ""
    default_capacity: int = 50  # number of TEAMS (editable from the admin panel)

    # Session cookie (HttpOnly JWT). In production it is always Secure.
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_name: str = "tlp_session"

    # Login throttling
    trust_proxy_headers: bool = False  # honour X-Forwarded-For (only behind your own reverse proxy)
    login_max_failures: int = 5
    login_window_seconds: int = 15 * 60

    # Notification e-mails. Leave SMTP_HOST empty in dev: mails are only logged.
    site_url: str = "http://localhost:3000"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""      # defaults to ADMIN_EMAIL
    smtp_password: str = ""
    mail_from: str = ""      # defaults to the admin address
    mail_max_attempts: int = 8

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def sender_address(self) -> str:
        """Notification mails leave from the admin address unless MAIL_FROM overrides it."""
        return self.mail_from or self.smtp_user or self.admin_email

    @model_validator(mode="after")
    def _harden(self):
        if not self.smtp_user and self.admin_email and self.smtp_host:
            self.smtp_user = self.admin_email
        if self.is_production:
            problems = []
            if _is_placeholder(self.secret_key) or len(self.secret_key) < 32:
                problems.append("SECRET_KEY must be a random string of at least 32 characters")
            if _is_placeholder(self.admin_email):
                problems.append("ADMIN_EMAIL must be set")
            if _is_placeholder(self.admin_password):
                problems.append("ADMIN_PASSWORD must be set and must not be a default/placeholder value")
            if problems:
                raise ValueError("Unsafe production configuration: " + "; ".join(problems) + ".")
            self.cookie_secure = True
            if len(self.admin_password) < 12:
                log.warning("ADMIN_PASSWORD is shorter than 12 characters: use a long random password.")
        return self


settings = Settings()
