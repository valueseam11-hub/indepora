import hashlib
import json
from typing import Any


def create_seal(payload: dict[str, Any]) -> dict[str, str]:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return {
        "algorithm": "sha256",
        "digest": digest,
        "scope": "integrity of this serialized report only",
        "warning": "Unsigned digest; it does not prove source authenticity, lineage correctness, or claim truth.",
    }
