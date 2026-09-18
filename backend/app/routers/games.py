from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game import Game
from app.providers.rawg import RawgGameProvider, RawgProviderError
from app.services.game_catalog import sync_catalog_page
from app.services.game_persistence import save_game

router = APIRouter(prefix="/games", tags=["games"])


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
    created_at: datetime
    updated_at: datetime


class GamesResponse(BaseModel):
    items: list[GameResponse]
    page: int
    page_size: int
    total: int


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
