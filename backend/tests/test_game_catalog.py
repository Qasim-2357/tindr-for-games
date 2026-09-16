import unittest
from datetime import date

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models.base import Base
from app.models.game import Game
from app.providers.game_provider import NormalizedGame, PaginatedGames
from app.services.game_catalog import sync_catalog_page


class FakeGameProvider:
    def fetch_games(self, **kwargs: object) -> PaginatedGames:
        return PaginatedGames(
            games=[
                NormalizedGame(
                    external_id="rawg-1",
                    external_provider="rawg",
                    name="Test Game",
                    slug="test-game",
                    description="A deterministic test game.",
                    release_date=date(2024, 1, 2),
                    rating=4.5,
                    rating_count=100,
                    metacritic=85,
                    cover_image="https://example.com/cover.jpg",
                    background_image="https://example.com/background.jpg",
                )
            ],
            page=2,
            page_size=5,
            total=17,
        )


class GameCatalogTests(unittest.TestCase):
    def test_sync_catalog_page_persists_and_returns_games(self) -> None:
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)

        with Session(engine) as db:
            result = sync_catalog_page(db, FakeGameProvider(), page=2, page_size=5)

            self.assertEqual(result.page, 2)
            self.assertEqual(result.page_size, 5)
            self.assertEqual(result.total, 17)
            self.assertEqual(len(result.games), 1)
            self.assertIsInstance(result.games[0], Game)
            self.assertIsNotNone(result.games[0].id)

            persisted = db.scalar(
                select(Game).where(
                    Game.external_provider == "rawg",
                    Game.external_id == "rawg-1",
                )
            )
            if persisted is None:
                self.fail("Persisted game was not found")
            self.assertEqual(persisted.name, "Test Game")
