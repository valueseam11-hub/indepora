from __future__ import annotations

import argparse
import getpass
import os
import sys

from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from fastapi import HTTPException

from .db import AuthSession, OwnerAccount, make_engine, utcnow
from .security import hash_password


def reset_owner_password() -> int:
    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url:
        print("DATABASE_URL is not configured.", file=sys.stderr)
        return 2

    first = getpass.getpass("New owner password (input hidden): ")
    second = getpass.getpass("Confirm new owner password: ")
    if first != second:
        print("Passwords did not match; no changes were made.", file=sys.stderr)
        return 2
    try:
        password_hash = hash_password(first)
    except HTTPException as error:
        print(str(error.detail), file=sys.stderr)
        return 2

    engine = make_engine(database_url)
    try:
        with Session(engine) as db:
            owner = db.get(OwnerAccount, "owner")
            if owner is None:
                print("Owner account is not initialized; no changes were made.", file=sys.stderr)
                return 2
            now = utcnow()
            owner.password_hash = password_hash
            owner.updated_at = now
            db.execute(
                update(AuthSession)
                .where(AuthSession.user_id == owner.user_id, AuthSession.revoked_at.is_(None))
                .values(revoked_at=now)
            )
            db.commit()
        print("Owner password reset; all prior sessions were revoked.")
        return 0
    except SQLAlchemyError:
        print("Password reset failed; check database connectivity and schema.", file=sys.stderr)
        return 1
    finally:
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(description="Private operator-only Indepora account recovery.")
    parser.add_argument("command", choices=["reset-owner-password"])
    args = parser.parse_args()
    if args.command == "reset-owner-password":
        return reset_owner_password()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
