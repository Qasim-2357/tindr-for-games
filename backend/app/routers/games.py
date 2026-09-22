from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.game import Game
from app.models.user import User
from app.models.wishlist import Wishlist
from app.providers.rawg import RawgGameProvider, RawgProviderError
from app.services.game_catalog import sync_catalog_page
from app.services.game_persistence import save_game

router = APIRouter(prefix="/games", tags=["games"])
wishlist_router = APIRouter(tags=["wishlist"])


class GameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    external_provider: str
    name: str
    slug: str
    description: str | None
    release_date: date | None
    rating: float | None
    rating_count: int | None
    metacritic: int | None
    cover_image: str | None
    background_image: str | None
    screenshots: list[str] | None
    created_at: datetime
    updated_at: datetime


class GamesResponse(BaseModel):
    items: list[GameResponse]
    page: int
    page_size: int
    total: int


class WishlistStatusResponse(BaseModel):
    wishlisted: bool


class WishlistResponse(BaseModel):
    game_id: int
    wishlisted: bool
    created_at: datetime


class WishlistGameResponse(BaseModel):
    game_id: int
    name: str
    slug: str
    cover_image: str | None
    release_date: date | None
    rating: float | None
    created_at: datetime


@router.get("", response_model=GamesResponse)
def get_games(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    ordering: str | None = None,
    genres: str | None = None,
    platforms: str | None = None,
    dates: str | None = None,
    db: Session = Depends(get_db),
) -> GamesResponse:
    try:
        provider_page = sync_catalog_page(
            db,
            RawgGameProvider(),
            page=page,
            page_size=page_size,
            search=search,
            ordering=ordering,
            genres=genres,
            platforms=platforms,
            dates=dates,
        )
    except RawgProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Game provider is currently unavailable",
        ) from error

    return GamesResponse(
        items=[GameResponse.model_validate(game) for game in provider_page.games],
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )


@router.get("/search", response_model=GamesResponse)
def search_games(
    q: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> GamesResponse:
    try:
        provider_page = sync_catalog_page(
            db,
            RawgGameProvider(),
            page=page,
            page_size=page_size,
            search=q,
        )
    except RawgProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Game provider is currently unavailable",
        ) from error

    return GamesResponse(
        items=[GameResponse.model_validate(game) for game in provider_page.games],
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )


@router.get("/new-releases", response_model=GamesResponse)
def get_new_releases(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> GamesResponse:
    today = date.today()
    dates = f"{today - timedelta(days=30)},{today}"

    try:
        provider_page = sync_catalog_page(
            db,
            RawgGameProvider(),
            page=page,
            page_size=page_size,
            ordering="-released",
            dates=dates,
        )
    except RawgProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Game provider is currently unavailable",
        ) from error

    return GamesResponse(
        items=[GameResponse.model_validate(game) for game in provider_page.games],
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )


@router.get("/popular", response_model=GamesResponse)
def get_popular_games(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> GamesResponse:
    try:
        provider_page = sync_catalog_page(
            db,
            RawgGameProvider(),
            page=page,
            page_size=page_size,
            ordering="-rating",
        )
    except RawgProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Game provider is currently unavailable",
        ) from error

    return GamesResponse(
        items=[GameResponse.model_validate(game) for game in provider_page.games],
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )


@router.get("/trending", response_model=GamesResponse)
def get_trending_games(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> GamesResponse:
    try:
        provider_page = sync_catalog_page(
            db,
            RawgGameProvider(),
            page=page,
            page_size=page_size,
            ordering="-added",
        )
    except RawgProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Game provider is currently unavailable",
        ) from error

    return GamesResponse(
        items=[GameResponse.model_validate(game) for game in provider_page.games],
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )


@router.post(
    "/{game_id}/wishlist",
    response_model=WishlistResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_wishlist(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistResponse:
    game = db.scalar(select(Game).where(Game.id == game_id))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    existing = db.scalar(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.game_id == game_id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Game is already wishlisted")

    wishlist = Wishlist(user_id=current_user.id, game_id=game_id)
    db.add(wishlist)
    try:
        db.commit()
        db.refresh(wishlist)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Game is already wishlisted",
        ) from None

    return WishlistResponse(
        game_id=wishlist.game_id,
        wishlisted=True,
        created_at=wishlist.created_at,
    )


@router.delete("/{game_id}/wishlist", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    game = db.scalar(select(Game).where(Game.id == game_id))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    wishlist = db.scalar(
        select(Wishlist).where(
            Wishlist.user_id == current_user.id,
            Wishlist.game_id == game_id,
        )
    )
    if wishlist is None:
        raise HTTPException(status_code=404, detail="Game is not wishlisted")

    db.delete(wishlist)
    db.commit()


@router.get("/{game_id}/wishlist", response_model=WishlistStatusResponse)
def get_wishlist_status(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistStatusResponse:
    game = db.scalar(select(Game).where(Game.id == game_id))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    wishlisted = db.scalar(
        select(Wishlist.id).where(
            Wishlist.user_id == current_user.id,
            Wishlist.game_id == game_id,
        )
    ) is not None
    return WishlistStatusResponse(wishlisted=wishlisted)


@wishlist_router.get("/wishlist", response_model=list[WishlistGameResponse])
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WishlistGameResponse]:
    rows = db.execute(
        select(Wishlist, Game)
        .join(Game, Game.id == Wishlist.game_id)
        .where(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc(), Wishlist.id.desc())
    ).all()

    return [
        WishlistGameResponse(
            game_id=game.id,
            name=game.name,
            slug=game.slug,
            cover_image=game.cover_image,
            release_date=game.release_date,
            rating=game.rating,
            created_at=wishlist.created_at,
        )
        for wishlist, game in rows
    ]


@router.get("/by-slug/{slug}", response_model=GameResponse)
def get_game_by_slug(slug: str, db: Session = Depends(get_db)) -> GameResponse:
    game = db.scalar(select(Game).where(Game.slug == slug))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.external_provider == "rawg":
        try:
            game = save_game(db, RawgGameProvider().fetch_game(game.external_id))
        except RawgProviderError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Game provider is currently unavailable",
            ) from error

    return GameResponse.model_validate(game)


@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: int, db: Session = Depends(get_db)) -> GameResponse:
    game = db.scalar(select(Game).where(Game.id == game_id))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    return GameResponse.model_validate(game)
