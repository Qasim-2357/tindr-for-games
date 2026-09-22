"""add game screenshots

Revision ID: b1e6d4f8c2a9
Revises: 8f4c2e91a7b6
Create Date: 2026-09-20 17:17:10.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1e6d4f8c2a9"
down_revision: Union[str, None] = "8f4c2e91a7b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("games", sa.Column("screenshots", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("games", "screenshots")
