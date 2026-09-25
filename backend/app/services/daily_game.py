from dataclasses import dataclass
from datetime import date
from hashlib import sha256

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_metadata import GameGenre
from app.models.genre import Genre
from app.models.user import User
from app.models.wishlist import Wishlist


@dataclass(frozen=True)
class DailyGenre:
    name: str
    slug: str


@dataclass(frozen=True)
class DailyGame:
    game: Game
    genres: list[DailyGenre]


@dataclass(frozen=True)
class DailyGamePage:
    games: list[DailyGame]
    page: int
    page_size: int
    total: int


def _daily_key(day: date, user_id: int | None, game_id: int) -> str:
    return sha256(f"{day.isoformat()}:{user_id or 0}:{game_id}".encode()).hexdigest()


def get_daily_games(
    db: Session,
    user: User | None,
    *,
    page: int = 1,
    page_size: int = 10,
) -> DailyGamePage:
    wishlisted_ids: set[int] = set()
    wishlist_genre_ids: set[int] = set()
    preferred_genre = user.identity_genre if user else None
    if user:
        wishlisted_ids = set(db.scalars(select(Wishlist.game_id).where(Wishlist.user_id == user.id)).all())
        wishlist_genre_ids = set(db.scalars(
            select(GameGenre.genre_id)
            .join(Wishlist, Wishlist.game_id == GameGenre.game_id)
            .where(Wishlist.user_id == user.id)
        ).all())

    rows = db.execute(
        select(Game, Genre)
        .outerjoin(GameGenre, GameGenre.game_id == Game.id)
        .outerjoin(Genre, Genre.id == GameGenre.genre_id)
        .where(~Game.id.in_(wishlisted_ids) if wishlisted_ids else True)
    ).all()
    grouped: dict[int, tuple[Game, list[DailyGenre]]] = {}
    for game, genre in rows:
        if game.id not in grouped:
            grouped[game.id] = (game, [])
        if genre:
            grouped[game.id][1].append(DailyGenre(name=genre.name, slug=genre.slug))

    today = date.today()
    candidates = list(grouped.values())

    def stable(items: list[tuple[Game, list[DailyGenre]]]) -> list[tuple[Game, list[DailyGenre]]]:
        return sorted(items, key=lambda item: _daily_key(today, user.id if user else None, item[0].id))

    preferred = stable([
        item for item in candidates
        if preferred_genre and any(
            g.slug == preferred_genre
            or g.name.lower() == preferred_genre.lower()
            or (preferred_genre == "rpg" and g.slug == "role-playing-games-rpg")
            for g in item[1]
        )
    ])
    wishlist_genres: list[tuple[Game, list[DailyGenre]]] = []
    if wishlist_genre_ids:
        wishlist_genre_slugs = set(db.scalars(select(Genre.slug).where(Genre.id.in_(wishlist_genre_ids))).all())
        wishlist_genres = stable([item for item in candidates if any(g.slug in wishlist_genre_slugs for g in item[1])])
    popular = sorted(
        candidates,
        key=lambda item: (-(item[0].rating or 0), -(item[0].rating_count or 0), _daily_key(today, user.id if user else None, item[0].id)),
    )
    new_releases = sorted(
        candidates,
        key=lambda item: (-(item[0].release_date or date.min).toordinal(), _daily_key(today, user.id if user else None, item[0].id)),
    )

    selected: list[tuple[Game, list[DailyGenre]]] = []
    seen: set[int] = set()

    def take(items: list[tuple[Game, list[DailyGenre]]], limit: int | None = None) -> None:
        for item in items:
            if item[0].id in seen:
                continue
            selected.append(item)
            seen.add(item[0].id)
            if limit is not None and len(selected) >= limit:
                break

    take(preferred, 4)
    take(wishlist_genres, min(6, len(selected) + 2))
    take(popular, min(8, len(selected) + 2))
    take(new_releases, min(9, len(selected) + 1))
    take(stable(candidates), 10)
    total = len(selected)
    start = (page - 1) * page_size
    return DailyGamePage(games=[DailyGame(*item) for item in selected[start:start + page_size]], page=page, page_size=page_size, total=total)
