from sqlalchemy import ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class GameGenre(Base):
    __tablename__ = "game_genres"
    __table_args__ = (Index("ix_game_genres_genre_id", "genre_id"),)

    game_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("games.id"),
        primary_key=True,
    )
    genre_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("genres.id"),
        primary_key=True,
    )


class GamePlatform(Base):
    __tablename__ = "game_platforms"
    __table_args__ = (Index("ix_game_platforms_platform_id", "platform_id"),)

    game_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("games.id"),
        primary_key=True,
    )
    platform_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("platforms.id"),
        primary_key=True,
    )
