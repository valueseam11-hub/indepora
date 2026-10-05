from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


class EvidenceInput(BaseModel):
    id: str = Field(default_factory=lambda: f"ev_{uuid4().hex[:12]}")
    title: str = Field(default="Untitled evidence", max_length=500)
    url: str | None = Field(default=None, max_length=4096)
    text: str | None = Field(default=None, max_length=100_000)
    origin_id: str | None = Field(default=None, max_length=200)
    derived_from: list[str] = Field(default_factory=list, max_length=100)
    published_at: datetime | None = None
    stance: Literal["supports", "contradicts", "unknown"] = "unknown"
    source_kind: str = Field(default="unknown", max_length=100)


class ReliancePolicy(BaseModel):
    """Optional workflow rules. These are operational rules, not a truth score."""

    minimum_documents: int = Field(default=0, ge=0, le=100)
    unknown_lineage_action: Literal["allow", "qualify", "block"] = "qualify"
    require_conflict_review: bool = True
    max_age_days: int | None = Field(default=None, ge=0, le=36500)


class InspectRequest(BaseModel):
    claim: str | None = Field(default=None, max_length=4000)
    answer: str | None = Field(default=None, max_length=20_000)
    evidence: list[EvidenceInput] = Field(default_factory=list, max_length=100)
    policy: ReliancePolicy | None = None

    @model_validator(mode="after")
    def require_claim_or_answer(self) -> "InspectRequest":
        if not (self.claim and self.claim.strip()) and not (self.answer and self.answer.strip()):
            raise ValueError("Provide a claim or an AI answer to inspect.")
        if not self.evidence:
            raise ValueError("Provide at least one evidence item.")
        ids = [item.id for item in self.evidence]
        if len(ids) != len(set(ids)):
            raise ValueError("Evidence IDs must be unique within a request.")
        return self


class OwnerBootstrapRequest(BaseModel):
    bootstrap_secret: str = Field(min_length=32, max_length=256)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=14, max_length=128)


class OwnerLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=14, max_length=128)
