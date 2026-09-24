from dataclasses import dataclass

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_metadata import GameGenre
from app.models.wishlist import Wishlist


@dataclass(frozen=True)
class RecommendationPage:
    games: list[Game]
    page: int
    page_size: int
    total: int


def get_recommendations(
    db: Session,
    user_id: int,
    *,
    page: int = 1,
    page_size: int = 20,
) -> RecommendationPage:
    preferred_genres = select(GameGenre.genre_id).join(
        Wishlist,
        Wishlist.game_id == GameGenre.game_id,
    ).where(Wishlist.user_id == user_id).distinct()

    total = db.scalar(
        select(func.count(Game.id))
        .where(
            Game.id.in_(
                select(GameGenre.game_id).where(
                    GameGenre.genre_id.in_(preferred_genres)
                )
            ),
            ~exists(
                select(Wishlist.id).where(
                    Wishlist.user_id == user_id,
                    Wishlist.game_id == Game.id,
                )
            ),
        )
    ) or 0

    if total == 0:
        return RecommendationPage(
            games=[],
            page=page,
            page_size=page_size,
            total=0,
        )

    match_count = func.count(GameGenre.genre_id)
    games = list(
        db.scalars(
            select(Game)
            .join(GameGenre, GameGenre.game_id == Game.id)
            .where(
                GameGenre.genre_id.in_(preferred_genres),
                ~exists(
                    select(Wishlist.id).where(
                        Wishlist.user_id == user_id,
                        Wishlist.game_id == Game.id,
                    )
                ),
            )
            .group_by(Game.id)
            .order_by(
                match_count.desc(),
                Game.rating.desc().nullslast(),
                Game.rating_count.desc().nullslast(),
                Game.id.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    return RecommendationPage(
        games=games,
        page=page,
        page_size=page_size,
        total=total,
    )
