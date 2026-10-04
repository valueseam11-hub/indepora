import re
from hashlib import sha256


def resolve_claim(claim: str | None, answer: str | None) -> dict[str, str]:
    if claim and claim.strip():
        text = " ".join(claim.split())
        method = "user_supplied"
    else:
        text = " ".join((answer or "").split())
        parts = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)
        text = parts[0] if parts else text
        method = "first_sentence_heuristic"
    if not text:
        text = "Claim not provided"
    claim_id = "clm_" + sha256(text.encode("utf-8")).hexdigest()[:12]
    return {"id": claim_id, "text": text, "extraction_method": method}
