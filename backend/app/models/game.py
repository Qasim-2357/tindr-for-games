from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        UniqueConstraint("external_provider", "external_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[str] = mapped_column(String, nullable=False)
    external_provider: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    release_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    rating_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metacritic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String, nullable=True)
    background_image: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
