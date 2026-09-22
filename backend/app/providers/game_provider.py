from dataclasses import dataclass
from datetime import date
from typing import Protocol


@dataclass(frozen=True)
class NormalizedGame:
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
    screenshots: list[str] | None = None


@dataclass(frozen=True)
class PaginatedGames:
    games: list[NormalizedGame]
    page: int
    page_size: int
    total: int


class GameProvider(Protocol):
    def fetch_game(self, external_id: str) -> NormalizedGame: ...

    def fetch_games(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        ordering: str | None = None,
        genres: str | None = None,
        platforms: str | None = None,
        dates: str | None = None,
    ) -> PaginatedGames: ...
