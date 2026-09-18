from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token,
    get_cookie_settings,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdateRequest(BaseModel):
    username: str | None = Field(default=None, max_length=100)
    identity_genre: str | None = None
    identity_color: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    identity_genre: str | None
    identity_color: str | None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    username = payload.username.strip()
    email = payload.email.strip().lower()
    if not username or not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Invalid username or email")

    existing_user = db.scalar(
        select(User).where((User.username == username) | (User.email == email))
    )
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists",
        ) from None
    return user


@router.post("/login", response_model=UserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    response.set_cookie(
        "access_token",
        create_access_token(user.id),
        **get_cookie_settings(),
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie("access_token", path="/")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


IDENTITY_GENRE_COLORS = {
    "horror": "purple",
    "action": "red",
    "adventure": "blue",
    "rpg": "gold",
    "strategy": "green",
    "indie": "pink",
}


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if "username" in payload.model_fields_set:
        if payload.username is None or not payload.username.strip():
            raise HTTPException(status_code=422, detail="Username cannot be empty")

        username = payload.username.strip()
        existing_user = db.scalar(
            select(User).where(
                User.username == username,
                User.id != current_user.id,
            )
        )
        if existing_user is not None:
            raise HTTPException(status_code=409, detail="Username already exists")
        current_user.username = username

    identity_fields = {"identity_genre", "identity_color"}
    if identity_fields & payload.model_fields_set:
        genre_provided = "identity_genre" in payload.model_fields_set
        color_provided = "identity_color" in payload.model_fields_set
        if genre_provided and payload.identity_genre is None:
            current_user.identity_genre = None
            current_user.identity_color = None
        elif color_provided and payload.identity_color is None:
            current_user.identity_genre = None
            current_user.identity_color = None
        elif not genre_provided:
            raise HTTPException(
                status_code=422,
                detail="Identity genre is required when setting a color",
            )
        else:
            genre_value = payload.identity_genre
            if genre_value is None:
                raise HTTPException(
                    status_code=422,
                    detail="Identity genre and color do not match",
                )
            genre = genre_value.strip().lower()
            if color_provided:
                color_value = payload.identity_color
                if color_value is None:
                    raise HTTPException(
                        status_code=422,
                        detail="Identity genre and color do not match",
                    )
                color = color_value.strip().lower()
            else:
                color = IDENTITY_GENRE_COLORS.get(genre)
            expected_color = IDENTITY_GENRE_COLORS.get(genre)
            if expected_color is None or color != expected_color:
                raise HTTPException(
                    status_code=422,
                    detail="Identity genre and color do not match",
                )
            current_user.identity_genre = genre
            current_user.identity_color = color

    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists") from None

    return current_user
