"""create game genre and platform associations

Revision ID: e7f3a1c9b842
Revises: c5a7e9b2d1f4
Create Date: 2026-09-24 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f3a1c9b842"
down_revision: Union[str, None] = "c5a7e9b2d1f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "game_genres",
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("genre_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["genre_id"], ["genres.id"]),
        sa.PrimaryKeyConstraint("game_id", "genre_id"),
    )
    op.create_index("ix_game_genres_genre_id", "game_genres", ["genre_id"], unique=False)

    op.create_table(
        "game_platforms",
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("platform_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["platform_id"], ["platforms.id"]),
        sa.PrimaryKeyConstraint("game_id", "platform_id"),
    )
    op.create_index(
        "ix_game_platforms_platform_id",
        "game_platforms",
        ["platform_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_game_platforms_platform_id", table_name="game_platforms")
    op.drop_table("game_platforms")
    op.drop_index("ix_game_genres_genre_id", table_name="game_genres")
    op.drop_table("game_genres")
