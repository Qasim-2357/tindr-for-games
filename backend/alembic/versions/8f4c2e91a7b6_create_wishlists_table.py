"""create wishlists table

Revision ID: 8f4c2e91a7b6
Revises: ddf67ad603c3
Create Date: 2026-09-20 16:25:58.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8f4c2e91a7b6"
down_revision: Union[str, None] = "ddf67ad603c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wishlists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "game_id",
            name="uq_wishlists_user_game",
        ),
    )
    op.create_index(
        "ix_wishlists_user_id",
        "wishlists",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_wishlists_user_id", table_name="wishlists")
    op.drop_table("wishlists")
