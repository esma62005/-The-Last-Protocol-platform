"""Notification e-mails, sent FROM the admin address.

* Every recipient gets his own message (nobody sees the other members' addresses).
* Messages are written to a durable queue (table email_outbox) and delivered by a background worker with
  exponential back-off, so an SMTP outage never loses a mail nor breaks a request.
* With SMTP_HOST empty (development) mails are only written to the log.
"""
import logging
import smtplib
import ssl
import threading
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models import EmailOutbox, User

log = logging.getLogger("mailer")
_wake = threading.Event()
_stop = threading.Event()
_thread: threading.Thread | None = None


def recipients(user: User) -> list[str]:
    """Leader + every other team member."""
    return [user.email, *(user.team.member_emails if user.team else [])]


# ---------- queue ----------
def enqueue(db: Session, to: list[str], subject: str, body: str) -> None:
    """One outbox row per distinct recipient."""
    for addr in sorted({t.strip().lower() for t in to if t and t.strip()}):
        db.add(EmailOutbox(to_addr=addr, subject=subject, body=body))
    db.commit()
    _wake.set()


def outbox_stats(db: Session) -> dict[str, int]:
    counts = dict(db.execute(select(EmailOutbox.status, func.count()).group_by(EmailOutbox.status)).all())
    return {k: int(counts.get(k, 0)) for k in ("pending", "sent", "failed")}


def retry_failed(db: Session) -> int:
    rows = db.scalars(select(EmailOutbox).where(EmailOutbox.status == "failed")).all()
    now = datetime.now(timezone.utc)
    for r in rows:
        r.status, r.attempts, r.next_attempt_at = "pending", 0, now
    db.commit()
    _wake.set()
    return len(rows)


# ---------- delivery ----------
def _build(row: EmailOutbox) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = settings.sender_address
    msg["Reply-To"] = settings.sender_address
    msg["To"] = row.to_addr  # a single recipient per message
    msg["Subject"] = row.subject
    msg.set_content(row.body)
    return msg


def _smtp():
    if settings.smtp_port == 465:
        s = smtplib.SMTP_SSL(settings.smtp_host, 465, context=ssl.create_default_context(), timeout=20)
    else:
        s = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20)
        s.starttls(context=ssl.create_default_context())
    if settings.smtp_user:
        s.login(settings.smtp_user, settings.smtp_password)
    return s


def deliver(rows: list[EmailOutbox]) -> dict[int, str | None]:
    """Try to send the rows; returns {row.id: error or None}. Overridable in tests."""
    out: dict[int, str | None] = {}
    if not settings.smtp_host:
        for r in rows:
            log.info("[mail not configured -> logged only] to=%s\nsubject: %s\n%s", r.to_addr, r.subject, r.body)
            out[r.id] = None
        return out
    try:
        with _smtp() as s:
            for r in rows:
                try:
                    s.send_message(_build(r))
                    out[r.id] = None
                except Exception as exc:  # noqa: BLE001
                    out[r.id] = f"{type(exc).__name__}: {exc}"[:500]
    except Exception as exc:  # noqa: BLE001  (connection / login failure)
        for r in rows:
            out.setdefault(r.id, f"{type(exc).__name__}: {exc}"[:500])
    return out


def process_outbox(session_factory: sessionmaker, batch: int = 25) -> int:
    """Send due messages. Safe with several workers (SKIP LOCKED on PostgreSQL). Returns how many were sent."""
    sent = 0
    with session_factory() as db:
        now = datetime.now(timezone.utc)
        rows = db.scalars(select(EmailOutbox).where(EmailOutbox.status == "pending", EmailOutbox.next_attempt_at <= now)
                          .order_by(EmailOutbox.id).limit(batch).with_for_update(skip_locked=True)).all()
        if not rows:
            return 0
        for row_id, err in deliver(list(rows)).items():
            row = next(r for r in rows if r.id == row_id)
            row.attempts += 1
            if err is None:
                row.status, row.sent_at, row.last_error = "sent", now, ""
                sent += 1
            else:
                row.last_error = err
                if row.attempts >= settings.mail_max_attempts:
                    row.status = "failed"
                    log.error("E-mail to %s gave up after %s attempts: %s", row.to_addr, row.attempts, err)
                else:  # 1 min, 2, 4, 8 ... capped at 1 hour
                    row.next_attempt_at = now + timedelta(seconds=min(60 * 2 ** (row.attempts - 1), 3600))
                    log.warning("E-mail to %s failed (attempt %s), will retry: %s", row.to_addr, row.attempts, err)
        db.commit()
    return sent


def _loop(session_factory: sessionmaker) -> None:
    while not _stop.is_set():
        try:
            while process_outbox(session_factory):
                pass
        except Exception:  # noqa: BLE001
            log.exception("Mail worker error")
        _wake.wait(15)
        _wake.clear()


def start_worker(session_factory: sessionmaker) -> None:
    global _thread
    _stop.clear()
    _thread = threading.Thread(target=_loop, args=(session_factory,), name="mail-worker", daemon=True)
    _thread.start()


def stop_worker() -> None:
    _stop.set()
    _wake.set()


# ---------- message templates ----------
def _footer() -> str:
    return (f"\nDashboard / Tableau de bord : {settings.site_url}/dashboard\n"
            f"Log in / Connexion : {settings.site_url}/login\n\n"
            "-- CYWORK · THE LAST PROTOCOL 2026 · 15-17 December / décembre 2026")


def queue_registration(db: Session, user: User) -> None:
    team_name, ticket = user.team.name, user.id
    enqueue(db, recipients(user), "THE LAST PROTOCOL - registration received / inscription reçue", (
        f"Your team \"{team_name}\" is registered (ticket {ticket}). Its application is now under review: "
        "you will receive another e-mail here as soon as the organisers decide. You can also check the status "
        "on the website at any time.\n\n"
        f"Votre équipe « {team_name} » est enregistrée (ticket {ticket}). Sa candidature est en cours d'examen : "
        "vous recevrez un nouvel e-mail dès la décision des organisateurs. Le statut est aussi visible sur le site."
        + _footer()))


def queue_status(db: Session, user: User, status: str) -> None:
    team_name, ticket = (user.team.name if user.team else user.name), user.id
    if status == "accepted":
        enqueue(db, recipients(user), "THE LAST PROTOCOL - your team is ACCEPTED / équipe ACCEPTÉE", (
            f"Congratulations! The team \"{team_name}\" has been accepted to THE LAST PROTOCOL.\n"
            f"Ticket: {ticket} (QR code available in your dashboard)\n"
            "Check-in: Tuesday 15 December 2026, 08:30 - Central Library (Bibliothèque centrale).\n"
            "Please bring your laptop, charger and student ID.\n\n"
            f"Félicitations ! L'équipe « {team_name} » est acceptée à THE LAST PROTOCOL.\n"
            f"Ticket : {ticket} (QR code dans votre tableau de bord)\n"
            "Accueil : mardi 15 décembre 2026 à 08:30 - Bibliothèque centrale."
            + _footer()))
    elif status == "rejected":
        enqueue(db, recipients(user), "THE LAST PROTOCOL - application update / mise à jour", (
            f"Thank you for applying. Unfortunately the team \"{team_name}\" was not retained this time.\n\n"
            f"Merci pour votre candidature. Malheureusement, l'équipe « {team_name} » n'a pas été retenue cette fois."
            + _footer()))
