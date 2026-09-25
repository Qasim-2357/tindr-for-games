from logging.config import fileConfig

from alembic import context

from app.config import load_repository_environment

load_repository_environment()

from app.database import database_url, engine
from app.models.game import Game
from app.models.game_metadata import GameGenre, GamePlatform
from app.models.genre import Genre
from app.models.base import Base
from app.models.comment import Comment
from app.models.comment_like import CommentLike
from app.models.platform import Platform
from app.models.user import User
from app.models.wishlist import Wishlist

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=str(database_url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
