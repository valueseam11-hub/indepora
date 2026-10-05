from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from argon2 import PasswordHasher, exceptions as argon2_exceptions
from fastapi import HTTPException, Request, Response

PASSWORD_HASHER = PasswordHasher(time_cost=2, memory_cost=19_456, parallelism=1)
DUMMY_PASSWORD_HASH = PASSWORD_HASHER.hash(secrets.token_urlsafe(24))
SESSION_TTL = timedelta(hours=8)
SESSION_IDLE_TTL = timedelta(minutes=30)
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_email(value: str) -> str:
    email = value.strip().lower()
    if len(email) > 320 or not EMAIL_PATTERN.fullmatch(email):
        raise HTTPException(status_code=422, detail="Invalid account details.")
    return email


def validate_password(value: str) -> None:
    if len(value) < 14 or len(value) > 128 or len(value.encode("utf-8")) > 512:
        raise HTTPException(status_code=422, detail="Password must be 14–128 characters.")


def hash_password(value: str) -> str:
    validate_password(value)
    return PASSWORD_HASHER.hash(value)


def verify_password(encoded: str, value: str) -> bool:
    try:
        return PASSWORD_HASHER.verify(encoded, value)
    except (argon2_exceptions.VerifyMismatchError, argon2_exceptions.VerificationError, argon2_exceptions.InvalidHashError):
        return False


def new_session_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    digest = hashlib.sha256(raw.encode("ascii")).hexdigest()
    return raw, digest


def session_digest(raw: str) -> str:
    return hashlib.sha256(raw.encode("ascii", "ignore")).hexdigest()


def create_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response: Response, token: str, *, cookie_name: str, secure: bool) -> None:
    response.set_cookie(
        cookie_name,
        token,
        max_age=SESSION_TTL.seconds,
        path="/",
        secure=secure,
        httponly=False,
        samesite="strict",
    )


def set_session_cookie(response: Response, token: str, *, cookie_name: str, secure: bool) -> None:
    response.set_cookie(
        cookie_name,
        token,
        max_age=SESSION_TTL.seconds,
        path="/",
        secure=secure,
        httponly=True,
        samesite="strict",
    )


def delete_session_cookie(response: Response, *, cookie_name: str, secure: bool) -> None:
    response.delete_cookie(cookie_name, path="/", secure=secure, httponly=True, samesite="strict")


def require_csrf(request: Request, *, csrf_cookie_name: str) -> None:
    cookie_value = request.cookies.get(csrf_cookie_name, "")
    header_value = request.headers.get("x-csrf-token", "")
    if not cookie_value or not header_value or not hmac.compare_digest(cookie_value, header_value):
        raise HTTPException(status_code=403, detail="Request could not be verified.")

    origin = request.headers.get("origin")
    if origin:
        try:
            origin_parts = urlsplit(origin)
            origin_host = origin_parts.netloc.casefold()
            origin_port = origin_parts.port
            request_host = request.headers.get("host", "").casefold()
            request_parts = urlsplit("//" + request_host)
            request_port = request_parts.port
        except ValueError:
            raise HTTPException(status_code=403, detail="Request could not be verified.")
        allowed_scheme = "https" if getattr(request.app.state, "cookie_secure", False) else "http"
        same_origin = bool(origin_host and request_host and origin_host == request_host)
        local_dev_origin = (
            origin in {"http://localhost:3000", "http://127.0.0.1:3000"}
            and origin_parts.scheme == "http"
            and origin_port == 3000
            and request_port == 8000
            and origin_parts.hostname == request_parts.hostname
        )
        if origin_parts.scheme != allowed_scheme or (not same_origin and not local_dev_origin):
            raise HTTPException(status_code=403, detail="Request could not be verified.")
    elif request.headers.get("sec-fetch-site", "").casefold() == "cross-site":
        raise HTTPException(status_code=403, detail="Request could not be verified.")


def bootstrap_secret_matches(expected: str | None, candidate: str) -> bool:
    if not expected or not candidate:
        return False
    return hmac.compare_digest(expected.encode("utf-8"), candidate.encode("utf-8"))
