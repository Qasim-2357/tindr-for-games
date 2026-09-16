from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.game import Game
from app.providers.game_provider import GameProvider
from app.services.game_persistence import save_game


@dataclass(frozen=True)
class CatalogPage:
    games: list[Game]
    page: int
    page_size: int
    total: int


def sync_catalog_page(
    db: Session,
    provider: GameProvider,
    *,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    ordering: str | None = None,
    genres: str | None = None,
    platforms: str | None = None,
    dates: str | None = None,
) -> CatalogPage:
    provider_page = provider.fetch_games(
        page=page,
        page_size=page_size,
        search=search,
        ordering=ordering,
        genres=genres,
        platforms=platforms,
        dates=dates,
    )
    games = [save_game(db, normalized_game) for normalized_game in provider_page.games]

    return CatalogPage(
        games=games,
        page=provider_page.page,
        page_size=provider_page.page_size,
        total=provider_page.total,
    )
