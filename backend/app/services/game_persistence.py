from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.game import Game
from app.providers.game_provider import NormalizedGame


def save_game(db: Session, normalized_game: NormalizedGame) -> Game:
    statement = select(Game).where(
        Game.external_provider == normalized_game.external_provider,
        Game.external_id == normalized_game.external_id,
    )

    try:
        game = db.scalar(statement)

        if game is None:
            game = Game(
                external_id=normalized_game.external_id,
                external_provider=normalized_game.external_provider,
            )
            db.add(game)

        game.name = normalized_game.name
        game.slug = normalized_game.slug
        game.description = normalized_game.description
        game.release_date = normalized_game.release_date
        game.rating = normalized_game.rating
        game.rating_count = normalized_game.rating_count
        game.metacritic = normalized_game.metacritic
        game.cover_image = normalized_game.cover_image
        game.background_image = normalized_game.background_image
        game.screenshots = normalized_game.screenshots

        db.commit()
        db.refresh(game)
        return game
    except SQLAlchemyError:
        db.rollback()
        raise
