"""create comments and comment likes

Revision ID: c5a7e9b2d1f4
Revises: b1e6d4f8c2a9
Create Date: 2026-09-22 17:16:08.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5a7e9b2d1f4"
down_revision: Union[str, None] = "b1e6d4f8c2a9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["comments.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_game_id", "comments", ["game_id"], unique=False)
    op.create_index("ix_comments_user_id", "comments", ["user_id"], unique=False)
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"], unique=False)

    op.create_table(
        "comment_likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("comment_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "comment_id",
            name="uq_comment_likes_user_comment",
        ),
    )
    op.create_index(
        "ix_comment_likes_comment_id",
        "comment_likes",
        ["comment_id"],
        unique=False,
    )
    op.create_index(
        "ix_comment_likes_user_id",
        "comment_likes",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_comment_likes_user_id", table_name="comment_likes")
    op.drop_index("ix_comment_likes_comment_id", table_name="comment_likes")
    op.drop_table("comment_likes")
    op.drop_index("ix_comments_parent_id", table_name="comments")
    op.drop_index("ix_comments_user_id", table_name="comments")
    op.drop_index("ix_comments_game_id", table_name="comments")
    op.drop_table("comments")
