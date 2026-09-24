from dataclasses import dataclass

from sqlalchemy import and_, case, exists, func, or_, select
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_metadata import GameGenre, GamePlatform
from app.models.genre import Genre
from app.models.platform import Platform
from app.models.wishlist import Wishlist
from app.services.ai_preferences import AIPreferences


@dataclass(frozen=True)
class AIGameSearchPage:
    games: list[Game]
    page: int
    page_size: int
    total: int


def _normalize_value(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _genre_match(value: str):
    return exists(
        select(GameGenre.game_id)
        .join(Genre, Genre.id == GameGenre.genre_id)
        .where(
            GameGenre.game_id == Game.id,
            or_(
                func.lower(func.trim(Genre.name)) == value,
                func.lower(func.replace(func.trim(Genre.slug), "-", " ")) == value,
            ),
        )
    )


def _platform_match(value: str):
    return exists(
        select(GamePlatform.game_id)
        .join(Platform, Platform.id == GamePlatform.platform_id)
        .where(
            GamePlatform.game_id == Game.id,
            or_(
                func.lower(func.trim(Platform.name)) == value,
                func.lower(func.replace(func.trim(Platform.slug), "-", " ")) == value,
            ),
        )
    )


def _keyword_match(value: str):
    pattern = f"%{value}%"
    return or_(Game.name.ilike(pattern), Game.description.ilike(pattern))


def search_games_by_preferences(
    db: Session,
    preferences: AIPreferences,
    *,
    user_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
) -> AIGameSearchPage:
    required_genres = {
        _normalize_value(value) for value in preferences.required_genres
    }
    genre_alternatives = {
        _normalize_value(value) for value in preferences.genre_alternatives
    }
    platforms = {_normalize_value(value) for value in preferences.platforms}
    keywords = {_normalize_value(value) for value in preferences.keywords}
    required_genres.discard("")
    genre_alternatives.discard("")
    platforms.discard("")
    keywords.discard("")

    required_genre_groups = [
        [_genre_match(value)]
        for value in sorted(required_genres)
    ]
    alternative_genre_matches = [
        criterion
        for value in sorted(genre_alternatives)
        for criterion in (_genre_match(value), _keyword_match(value))
    ]
    platform_matches = [_platform_match(value) for value in sorted(platforms)]
    keyword_matches = [_keyword_match(value) for value in sorted(keywords)]
    criteria = [
        *(criterion for group in required_genre_groups for criterion in group),
        *alternative_genre_matches,
        *platform_matches,
        *keyword_matches,
    ]

    if not criteria:
        return AIGameSearchPage(
            games=[],
            page=page,
            page_size=page_size,
            total=0,
        )

    required_genre_matches = (
        and_(*(or_(*group) for group in required_genre_groups))
        if required_genre_groups
        else None
    )
    eligible_groups = [
        required_genre_matches,
        or_(*alternative_genre_matches)
        if alternative_genre_matches
        else None,
        or_(*platform_matches) if platform_matches else None,
        or_(*keyword_matches) if keyword_matches else None,
    ]
    eligible = and_(*(group for group in eligible_groups if group is not None))
    wishlist_exclusion = (
        ~exists(
            select(Wishlist.id).where(
                Wishlist.user_id == user_id,
                Wishlist.game_id == Game.id,
            )
        )
        if user_id is not None
        else None
    )
    filters = [eligible]
    if wishlist_exclusion is not None:
        filters.append(wishlist_exclusion)

    total = db.scalar(select(func.count(Game.id)).where(*filters)) or 0
    match_score = sum(case((criterion, 1), else_=0) for criterion in criteria)
    games = list(
        db.scalars(
            select(Game)
            .where(*filters)
            .order_by(
                match_score.desc(),
                Game.rating.desc().nullslast(),
                Game.rating_count.desc().nullslast(),
                Game.id.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    return AIGameSearchPage(
        games=games,
        page=page,
        page_size=page_size,
        total=total,
    )
