import os
from datetime import datetime, timedelta, timezone
from typing import Literal, TypedDict

import jwt
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


class CookieSettings(TypedDict):
    max_age: int
    secure: bool
    httponly: bool
    samesite: Literal["lax", "strict", "none"]
    path: str


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(password, hashed_password)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")

    expires_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        secret_key,
        algorithm="HS256",
    )


def get_cookie_settings() -> CookieSettings:
    return {
        "max_age": int(os.getenv("JWT_EXPIRE_MINUTES", "30")) * 60,
        "secure": os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true",
        "httponly": True,
        "samesite": "lax",
        "path": "/",
    }
