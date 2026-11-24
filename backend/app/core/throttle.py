"""In-memory login throttling (per process): progressive lock-out per e-mail and per IP + audit log of suspicious attempts."""
import logging
import threading
import time
from dataclasses import dataclass, field

from fastapi import Request

from app.core.config import settings

log = logging.getLogger("security")


@dataclass
class _Entry:
    failures: list[float] = field(default_factory=list)
    locked_until: float = 0.0


class LoginThrottle:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: dict[str, _Entry] = {}

    def reset(self) -> None:
        with self._lock:
            self._entries.clear()

    def _limit(self, key: str) -> int:
        return settings.login_max_failures * (4 if key.startswith("ip:") else 1)

    def retry_after(self, *keys: str) -> int:
        """Seconds the caller must wait (0 = allowed)."""
        now = time.monotonic()
        with self._lock:
            wait = max((self._entries[k].locked_until - now for k in keys if k in self._entries), default=0)
        return max(0, int(wait) + (1 if wait > 0 else 0))

    def fail(self, *keys: str) -> None:
        now = time.monotonic()
        with self._lock:
            for k in keys:
                e = self._entries.setdefault(k, _Entry())
                e.failures = [t for t in e.failures if now - t < settings.login_window_seconds] + [now]
                over = len(e.failures) - self._limit(k)
                if over >= 0:  # progressive delay: 30s, 60s, 120s ... capped at the window length
                    e.locked_until = now + min(30 * 2 ** over, settings.login_window_seconds)
            if len(self._entries) > 10000:  # keep memory bounded
                self._entries = {k: v for k, v in self._entries.items() if v.failures and now - v.failures[-1] < settings.login_window_seconds}

    def success(self, *keys: str) -> None:
        with self._lock:
            for k in keys:
                self._entries.pop(k, None)


throttle = LoginThrottle()


def client_ip(request: Request) -> str:
    if settings.trust_proxy_headers:
        fwd = request.headers.get("x-forwarded-for", "")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
