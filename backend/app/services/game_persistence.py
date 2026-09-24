from sqlalchemy import delete, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.game_metadata import GameGenre, GamePlatform
from app.models.genre import Genre
from app.models.platform import Platform
from app.providers.game_provider import NormalizedGame, NormalizedMetadata


def _metadata_slug(metadata: NormalizedMetadata) -> str:
    return metadata.slug or "-".join(metadata.name.lower().split())


def _get_or_create_metadata(db: Session, model: type[Genre] | type[Platform], metadata: NormalizedMetadata) -> Genre | Platform:
    slug = _metadata_slug(metadata)
    item = db.scalar(select(model).where(model.slug == slug))
    if item is None:
        item = db.scalar(select(model).where(model.name == metadata.name))
    if item is None:
        item = model(name=metadata.name, slug=slug)
        db.add(item)
        db.flush()
    return item


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
        db.flush()

        if normalized_game.genres:
            db.execute(delete(GameGenre).where(GameGenre.game_id == game.id))
            genre_ids = {
                _get_or_create_metadata(db, Genre, metadata).id
                for metadata in normalized_game.genres
            }
            game_genres = [
                GameGenre(game_id=game.id, genre_id=genre_id)
                for genre_id in genre_ids
            ]
            db.add_all(game_genres)

        if normalized_game.platforms:
            db.execute(delete(GamePlatform).where(GamePlatform.game_id == game.id))
            platform_ids = {
                _get_or_create_metadata(db, Platform, metadata).id
                for metadata in normalized_game.platforms
            }
            game_platforms = [
                GamePlatform(game_id=game.id, platform_id=platform_id)
                for platform_id in platform_ids
            ]
            db.add_all(game_platforms)

        db.commit()
        db.refresh(game)
        return game
    except SQLAlchemyError:
        db.rollback()
        raise
