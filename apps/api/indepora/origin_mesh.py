from hashlib import sha256
import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


TRACKING_KEYS = {"fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source"}
SENSITIVE_KEYS = {
    "access_token", "apikey", "api_key", "auth", "authorization", "code",
    "client_secret", "key", "password", "passwd", "secret", "session",
    "sessionid", "sid", "sig", "signature", "token",
}
TRACKING_PREFIXES = ("utm_",)


def canonicalize_url(url: str | None) -> str | None:
    if not url:
        return None
    raw = url.strip()
    if not raw:
        return None
    if "://" not in raw:
        raw = "https://" + raw
    try:
        parts = urlsplit(raw)
        scheme = (parts.scheme or "https").lower()
        host = (parts.hostname or "").lower().rstrip(".")
        if not host or scheme not in {"http", "https"}:
            return None
        try:
            port = parts.port
        except ValueError:
            return None
        netloc = host
        if port and not ((scheme == "https" and port == 443) or (scheme == "http" and port == 80)):
            netloc = f"{host}:{port}"
        path = re.sub(r"/{2,}", "/", parts.path or "/")
        if path != "/":
            path = path.rstrip("/")
        query = [
            (key, value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
            if key.lower() not in TRACKING_KEYS
            and key.lower() not in SENSITIVE_KEYS
            and not any(key.lower().startswith(prefix) for prefix in TRACKING_PREFIXES)
        ]
        query.sort()
        # Reconstructing from hostname also removes user-info credentials and fragments.
        return urlunsplit((scheme, netloc, path, urlencode(query, doseq=True), ""))
    except (TypeError, ValueError):
        return None


def content_fingerprint(text: str | None) -> str | None:
    if not text or not text.strip():
        return None
    # This is exact text after whitespace normalization, not semantic equivalence.
    normalized = " ".join(text.split())
    return sha256(normalized.encode("utf-8")).hexdigest()


def origin_key(url: str | None, explicit_origin_id: str | None = None) -> str | None:
    if explicit_origin_id and explicit_origin_id.strip():
        return "origin:" + explicit_origin_id.strip()
    canonical = canonicalize_url(url)
    if not canonical:
        return None
    host = urlsplit(canonical).hostname
    return f"host:{host}" if host else None
