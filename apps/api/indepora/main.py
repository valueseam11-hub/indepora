from __future__ import annotations

import hashlib
import hmac
import logging
import os
import secrets
import threading
import time
from collections import OrderedDict, defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Generator
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from . import __version__
from .analysis_engine import inspect_reliance
from .db import AuthSession, OwnerAccount, SavedRelianceRecord, make_engine, make_session_factory, utcnow
from .models import InspectRequest, OwnerBootstrapRequest, OwnerLoginRequest, PasswordChangeRequest
from .records import build_saved_record
from .seal_engine import create_seal
from .security import (
    DUMMY_PASSWORD_HASH,
    PASSWORD_HASHER,
    SESSION_IDLE_TTL,
    SESSION_TTL,
    bootstrap_secret_matches,
    create_csrf_token,
    delete_session_cookie,
    hash_password,
    new_session_token,
    normalize_email,
    require_csrf,
    session_digest,
    set_csrf_cookie,
    set_session_cookie,
    utcnow as security_utcnow,
    validate_password,
    verify_password,
)

MAX_API_BODY_BYTES = 2 * 1024 * 1024
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_ATTEMPTS = 8
LOGIN_FAILURES: dict[str, tuple[float, int]] = {}
LOGGER = logging.getLogger("indepora.request")
STEMCHECK_WINDOW_SECONDS = 60.0
STEMCHECK_MAX_PER_MINUTE = 1200


def _take_stemcheck_slot(request: Request) -> tuple[bool, int]:
    """Apply an in-memory per-client limit without persisting or logging client IPs."""
    state = request.app.state
    remote = request.client.host if request.client else "unknown"
    key = hmac.new(state.stemcheck_rate_salt, remote.encode("utf-8", "replace"), hashlib.sha256).hexdigest()
    now = time.monotonic()
    with state.stemcheck_rate_lock:
        buckets = state.stemcheck_rate_buckets
        events = buckets.get(key)
        if events is None:
            events = deque()
            buckets[key] = events
        while events and now - events[0] >= STEMCHECK_WINDOW_SECONDS:
            events.popleft()
        if len(events) >= state.stemcheck_rate_limit:
            retry_after = max(1, int(STEMCHECK_WINDOW_SECONDS - (now - events[0]) + 0.999))
            buckets.move_to_end(key)
            return False, retry_after
        events.append(now)
        buckets.move_to_end(key)
        while len(buckets) > 10_000:
            buckets.popitem(last=False)
    return True, 0


def _aware(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _issue_session(db: Session, owner: OwnerAccount, response: Response, app: FastAPI) -> str:
    raw_token, digest = new_session_token()
    now = utcnow()
    db.add(AuthSession(
        token_digest=digest,
        user_id=owner.user_id,
        created_at=now,
        last_seen_at=now,
        expires_at=now + SESSION_TTL,
    ))
    db.commit()
    set_session_cookie(
        response,
        raw_token,
        cookie_name=app.state.session_cookie_name,
        secure=app.state.cookie_secure,
    )
    csrf_token = create_csrf_token()
    set_csrf_cookie(
        response,
        csrf_token,
        cookie_name=app.state.csrf_cookie_name,
        secure=app.state.cookie_secure,
    )
    return csrf_token


def _database_unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="Private storage is unavailable.")


def _login_bucket(request: Request) -> str:
    remote = request.client.host if request.client else "unknown"
    return hashlib.sha256(remote.encode("utf-8", "replace")).hexdigest()


def _check_login_rate(request: Request) -> str:
    now = time.monotonic()
    key = _login_bucket(request)
    started, attempts = LOGIN_FAILURES.get(key, (now, 0))
    if now - started >= LOGIN_WINDOW_SECONDS:
        started, attempts = now, 0
    if attempts >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.", headers={"Retry-After": str(LOGIN_WINDOW_SECONDS)})
    return key


def _record_login_failure(key: str) -> None:
    now = time.monotonic()
    started, attempts = LOGIN_FAILURES.get(key, (now, 0))
    if now - started >= LOGIN_WINDOW_SECONDS:
        started, attempts = now, 0
    if len(LOGIN_FAILURES) > 5000:
        for old_key, (old_started, _) in list(LOGIN_FAILURES.items()):
            if now - old_started >= LOGIN_WINDOW_SECONDS:
                LOGIN_FAILURES.pop(old_key, None)
    LOGIN_FAILURES[key] = (started, attempts + 1)


def create_app(
    *,
    database_url: str | None = None,
    engine=None,
    bootstrap_secret: str | None = None,
    secure_cookies: bool | None = None,
    static_dir: str | None = None,
) -> FastAPI:
    """Build an app instance. Tests can supply an isolated SQLite engine."""
    app = FastAPI(
        title="Indepora Reliance Fabric API",
        version=__version__,
        description=(
            "Private, owner-authenticated evidence lineage analysis and explicit-save Reliance Records. "
            "The analysis does not establish truth or independence."
        ),
        openapi_url="/openapi.json",
        docs_url="/docs",
    )
    db_url = database_url if database_url is not None else os.getenv("DATABASE_URL")
    if engine is None and db_url:
        try:
            engine = make_engine(db_url)
        except Exception as exc:
            # Do not include exception text: a driver exception can contain connection details.
            LOGGER.error("database engine initialization failed error_type=%s", type(exc).__name__)
            engine = None
    app.state.engine = engine
    app.state.session_factory = make_session_factory(engine) if engine is not None else None
    app.state.bootstrap_secret = bootstrap_secret if bootstrap_secret is not None else os.getenv("INDEPORA_BOOTSTRAP_SECRET")
    if secure_cookies is None:
        secure_cookies = os.getenv("INDEPORA_COOKIE_SECURE", "").casefold() in {"1", "true", "yes"} or bool(os.getenv("RAILWAY_PUBLIC_DOMAIN"))
    app.state.cookie_secure = secure_cookies
    app.state.session_cookie_name = "__Host-indepora_session" if secure_cookies else "indepora_session"
    app.state.csrf_cookie_name = "__Host-indepora_csrf" if secure_cookies else "indepora_csrf"
    app.state.static_dir = static_dir or os.getenv("INDEPORA_STATIC_DIR", "/app/web")
    app.state.stemcheck_rate_buckets = OrderedDict()
    app.state.stemcheck_rate_lock = threading.Lock()
    app.state.stemcheck_rate_salt = secrets.token_bytes(32)
    app.state.stemcheck_rate_limit = STEMCHECK_MAX_PER_MINUTE

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )

    def get_db(request: Request) -> Generator[Session, None, None]:
        factory = request.app.state.session_factory
        if factory is None:
            raise _database_unavailable()
        db = factory()
        try:
            yield db
        finally:
            db.close()

    def require_owner(request: Request, db: Session = Depends(get_db)) -> OwnerAccount:
        raw_token = request.cookies.get(request.app.state.session_cookie_name, "")
        if not raw_token:
            raise HTTPException(status_code=401, detail="Authentication required.")
        try:
            session = db.get(AuthSession, session_digest(raw_token))
            now = utcnow()
            if session is None or session.revoked_at is not None:
                raise HTTPException(status_code=401, detail="Authentication required.")
            if _aware(session.expires_at) <= now or now - _aware(session.last_seen_at) > SESSION_IDLE_TTL:
                session.revoked_at = now
                db.commit()
                raise HTTPException(status_code=401, detail="Authentication required.")
            owner = db.get(OwnerAccount, session.user_id)
            if owner is None or owner.role != "owner":
                raise HTTPException(status_code=401, detail="Authentication required.")
            if now - _aware(session.last_seen_at) >= timedelta(minutes=5):
                session.last_seen_at = now
                db.commit()
            return owner
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    def require_request_csrf(request: Request) -> None:
        require_csrf(request, csrf_cookie_name=request.app.state.csrf_cookie_name)

    @app.middleware("http")
    async def privacy_and_request_audit(request: Request, call_next):
        request_id = uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        content_length = request.headers.get("content-length")
        response = None
        if request.url.path.startswith("/v1/") and content_length:
            try:
                declared_length = int(content_length)
            except ValueError:
                declared_length = -1
            if declared_length < 0:
                response = JSONResponse(status_code=400, content={"detail": "Invalid request."})
            elif declared_length > MAX_API_BODY_BYTES:
                response = JSONResponse(status_code=413, content={"detail": "Request exceeds the 2 MiB limit."})
        if response is None and request.url.path == "/v1/stemcheck" and request.method == "POST":
            allowed, retry_after = _take_stemcheck_slot(request)
            if not allowed:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Stemcheck request limit reached. Try again later."},
                    headers={"Retry-After": str(retry_after)},
                )
        if response is None:
            response = await call_next(request)

        route = request.scope.get("route")
        route_template = getattr(route, "path", "unmatched")
        duration_ms = int((time.perf_counter() - started) * 1000)
        LOGGER.info(
            "request_id=%s method=%s route=%s status=%s duration_ms=%d",
            request_id,
            request.method,
            route_template,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = request_id
        response.headers["Cache-Control"] = "no-store, private, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.app.state.cookie_secure:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        # Never echo Pydantic's input values; claim/evidence can be confidential.
        return JSONResponse(status_code=422, content={"detail": "Invalid request payload."})

    @app.exception_handler(Exception)
    async def safe_unhandled_error_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", "unknown")
        LOGGER.error("request_id=%s unhandled_error_type=%s", request_id, type(exc).__name__)
        return JSONResponse(status_code=500, content={"detail": "Internal server error.", "request_id": request_id})

    @app.get("/healthz", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.post("/v1/stemcheck", tags=["public"])
    def public_stemcheck(body: InspectRequest) -> dict[str, Any]:
        # Public analysis is transient: it has no database dependency and writes no record.
        return inspect_reliance(body)

    @app.get("/v1/auth/csrf", tags=["auth"])
    def get_csrf(request: Request, response: Response) -> dict[str, str]:
        cookie_name = request.app.state.csrf_cookie_name
        token = request.cookies.get(cookie_name, "")
        if len(token) < 32:
            token = create_csrf_token()
        set_csrf_cookie(response, token, cookie_name=cookie_name, secure=request.app.state.cookie_secure)
        return {"csrf_token": token}

    @app.get("/v1/auth/bootstrap/status", tags=["auth"])
    def bootstrap_status(db: Session = Depends(get_db)) -> dict[str, bool]:
        try:
            return {"owner_setup_required": db.get(OwnerAccount, "owner") is None}
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    @app.post("/v1/auth/bootstrap", tags=["auth"])
    def bootstrap_owner(
        body: OwnerBootstrapRequest,
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        require_request_csrf(request)
        if not bootstrap_secret_matches(request.app.state.bootstrap_secret, body.bootstrap_secret):
            raise HTTPException(status_code=403, detail="Owner setup could not be verified.")
        if db.get(OwnerAccount, "owner") is not None:
            raise HTTPException(status_code=409, detail="Owner setup is closed.")
        email = normalize_email(body.email)
        validate_password(body.password)
        raw_token, digest = new_session_token()
        now = utcnow()
        try:
            owner = OwnerAccount(
                user_id="owner",
                email=email,
                password_hash=hash_password(body.password),
                role="owner",
                created_at=now,
                updated_at=now,
            )
            db.add(owner)
            db.flush()
            db.add(AuthSession(token_digest=digest, user_id=owner.user_id, created_at=now, last_seen_at=now, expires_at=now + SESSION_TTL))
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Owner setup is closed.")
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()
        set_session_cookie(response, raw_token, cookie_name=request.app.state.session_cookie_name, secure=request.app.state.cookie_secure)
        csrf_token = create_csrf_token()
        set_csrf_cookie(response, csrf_token, cookie_name=request.app.state.csrf_cookie_name, secure=request.app.state.cookie_secure)
        return {"authenticated": True, "email": email, "csrf_token": csrf_token}

    @app.post("/v1/auth/login", tags=["auth"])
    def login(
        body: OwnerLoginRequest,
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        require_request_csrf(request)
        bucket = _check_login_rate(request)
        try:
            email = normalize_email(body.email)
            owner = db.get(OwnerAccount, "owner")
            stored_hash = owner.password_hash if owner is not None and owner.email == email else DUMMY_PASSWORD_HASH
            password_valid = verify_password(stored_hash, body.password)
            valid = owner is not None and owner.email == email and password_valid
            if not valid:
                _record_login_failure(bucket)
                raise HTTPException(status_code=401, detail="Email or password is incorrect.")
            LOGIN_FAILURES.pop(bucket, None)
            csrf_token = _issue_session(db, owner, response, request.app)
            return {"authenticated": True, "email": owner.email, "csrf_token": csrf_token}
        except HTTPException:
            raise
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    @app.get("/v1/auth/me", tags=["auth"])
    def who_am_i(owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        return {"authenticated": True, "email": owner.email, "role": "owner"}

    @app.post("/v1/auth/logout", status_code=204, tags=["auth"])
    def logout(
        request: Request,
        response: Response,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> Response:
        require_request_csrf(request)
        raw_token = request.cookies.get(request.app.state.session_cookie_name, "")
        try:
            session = db.get(AuthSession, session_digest(raw_token))
            if session is not None and session.user_id == owner.user_id:
                session.revoked_at = utcnow()
                db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()
        delete_session_cookie(response, cookie_name=request.app.state.session_cookie_name, secure=request.app.state.cookie_secure)
        token = create_csrf_token()
        set_csrf_cookie(response, token, cookie_name=request.app.state.csrf_cookie_name, secure=request.app.state.cookie_secure)
        response.status_code = 204
        return response

    @app.post("/v1/auth/password", tags=["auth"])
    def change_password(
        body: PasswordChangeRequest,
        request: Request,
        response: Response,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        require_request_csrf(request)
        if not verify_password(owner.password_hash, body.current_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect.")
        validate_password(body.new_password)
        try:
            owner.password_hash = hash_password(body.new_password)
            owner.updated_at = utcnow()
            db.query(AuthSession).filter(AuthSession.user_id == owner.user_id).delete(synchronize_session=False)
            raw_token, digest = new_session_token()
            now = utcnow()
            db.add(AuthSession(token_digest=digest, user_id=owner.user_id, created_at=now, last_seen_at=now, expires_at=now + SESSION_TTL))
            db.commit()
            set_session_cookie(response, raw_token, cookie_name=request.app.state.session_cookie_name, secure=request.app.state.cookie_secure)
            csrf_token = create_csrf_token()
            set_csrf_cookie(response, csrf_token, cookie_name=request.app.state.csrf_cookie_name, secure=request.app.state.cookie_secure)
            return {"updated": True, "csrf_token": csrf_token}
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    @app.post("/v1/reliance/inspect", tags=["reliance"])
    def inspect(request: InspectRequest, owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        return inspect_reliance(request)

    @app.post("/v1/reliance/collapse", tags=["reliance"])
    def collapse(request: InspectRequest, owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        return inspect_reliance(request)

    @app.post("/v1/reliance/evaluate", tags=["reliance"])
    def evaluate(request: InspectRequest, owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        return inspect_reliance(request)["policy_result"]

    @app.post("/v1/reliance/witness", tags=["reliance"])
    def witness(request: InspectRequest, owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        return inspect_reliance(request)["witness"]

    @app.post("/v1/reliance/seal", tags=["reliance"])
    def seal(request: InspectRequest, owner: OwnerAccount = Depends(require_owner)) -> dict[str, Any]:
        report = inspect_reliance(request)
        return {"reliance_id": report["reliance_id"], "seal": create_seal(report)}

    @app.post("/v1/records", status_code=201, tags=["records"])
    def save_record(
        body: InspectRequest,
        request: Request,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        require_request_csrf(request)
        report = inspect_reliance(body)
        payload = build_saved_record(report, body)
        try:
            timestamp = datetime.fromisoformat(payload["analysis_timestamp"])
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            row = SavedRelianceRecord(
                record_id=payload["record_id"],
                owner_id=owner.user_id,
                reliance_id=payload["reliance_id"],
                analysis_timestamp=timestamp,
                engine_version=payload["engine_version"],
                record_schema_version=payload["record_schema_version"],
                configuration_version=payload["configuration_version"],
                standing=payload["standing"],
                payload=payload,
                created_at=utcnow(),
            )
            db.add(row)
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()
        return payload

    @app.get("/v1/records", tags=["records"])
    def list_records(
        limit: int = 50,
        offset: int = 0,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        if not 1 <= limit <= 100 or offset < 0:
            raise HTTPException(status_code=422, detail="Invalid pagination request.")
        try:
            rows = db.scalars(
                select(SavedRelianceRecord)
                .where(SavedRelianceRecord.owner_id == owner.user_id)
                .order_by(SavedRelianceRecord.created_at.desc())
                .offset(offset)
                .limit(limit)
            ).all()
            return {
                "items": [
                    {
                        "record_id": row.record_id,
                        "reliance_id": row.reliance_id,
                        "analysis_timestamp": _aware(row.analysis_timestamp).isoformat(),
                        "engine_version": row.engine_version,
                        "standing": row.standing,
                        "claim": row.payload.get("claim", {}).get("text", ""),
                    }
                    for row in rows
                ],
                "limit": limit,
                "offset": offset,
            }
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    @app.get("/v1/records/{record_id}", tags=["records"])
    def get_record(
        record_id: str,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> dict[str, Any]:
        try:
            row = db.scalar(
                select(SavedRelianceRecord).where(
                    SavedRelianceRecord.record_id == record_id,
                    SavedRelianceRecord.owner_id == owner.user_id,
                )
            )
            if row is None:
                raise HTTPException(status_code=404, detail="Record not found.")
            # Return the stored immutable snapshot; do not recompute historical Standing.
            return row.payload
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()

    @app.delete("/v1/records/{record_id}", status_code=204, tags=["records"])
    def delete_record(
        record_id: str,
        request: Request,
        owner: OwnerAccount = Depends(require_owner),
        db: Session = Depends(get_db),
    ) -> Response:
        require_request_csrf(request)
        try:
            row = db.scalar(
                select(SavedRelianceRecord).where(
                    SavedRelianceRecord.record_id == record_id,
                    SavedRelianceRecord.owner_id == owner.user_id,
                )
            )
            if row is None:
                raise HTTPException(status_code=404, detail="Record not found.")
            db.delete(row)
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise _database_unavailable()
        return Response(status_code=204)

    static_dir_path = Path(app.state.static_dir)
    if static_dir_path.is_dir() and (static_dir_path / "index.html").exists():
        app.mount("/", StaticFiles(directory=str(static_dir_path), html=True), name="web")
    else:
        @app.get("/", include_in_schema=False)
        def root() -> dict[str, str]:
            return {"service": "Indepora Reliance Fabric", "version": __version__, "docs": "/docs"}

    return app


app = create_app()
