import os
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    secret_key = os.getenv("JWT_SECRET_KEY")
    if not secret_key or not access_token:
        raise credentials_error

    try:
        payload = jwt.decode(access_token, secret_key, algorithms=["HS256"])
        subject = payload.get("sub")
        if not isinstance(subject, str):
            raise ValueError
        user_id = int(subject)
        if user_id < 1:
            raise ValueError
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise credentials_error from None

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise credentials_error
    return user


def get_optional_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    if not access_token:
        return None
    try:
        secret_key = os.getenv("JWT_SECRET_KEY")
        if not secret_key:
            return None
        payload = jwt.decode(access_token, secret_key, algorithms=["HS256"])
        subject = payload.get("sub")
        user_id = int(subject)
        if user_id < 1:
            return None
    except (jwt.InvalidTokenError, TypeError, ValueError):
        return None
    return db.scalar(select(User).where(User.id == user_id))
