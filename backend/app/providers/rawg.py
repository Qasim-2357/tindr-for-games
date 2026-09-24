from dataclasses import replace
import json
import os
from datetime import date
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from app.providers.game_provider import NormalizedGame, NormalizedMetadata, PaginatedGames


class RawgProviderError(RuntimeError):
    pass


class RawgGameProvider:
    _base_url = "https://api.rawg.io/api/games"
    _provider_name = "rawg"

    def __init__(self) -> None:
        self._api_key = os.getenv("RAWG_API_KEY")
        if not self._api_key:
            raise RawgProviderError("RAWG_API_KEY is not configured")

    def fetch_game(self, external_id: str) -> NormalizedGame:
        payload = self._fetch_json(
            f"{self._base_url}/{quote(external_id, safe='')}?{urlencode({'key': self._api_key})}"
        )
        normalized_game = self._normalize_game(payload)
        if normalized_game.screenshots is not None:
            return normalized_game

        try:
            screenshots_payload = self._fetch_json(
                f"{self._base_url}/{quote(external_id, safe='')}/screenshots?"
                f"{urlencode({'key': self._api_key})}"
            )
            screenshots = self._screenshots(screenshots_payload.get("results"))
        except RawgProviderError:
            screenshots = None

        return replace(normalized_game, screenshots=screenshots)

    def fetch_games(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        ordering: str | None = None,
        genres: str | None = None,
        platforms: str | None = None,
        dates: str | None = None,
    ) -> PaginatedGames:
        if page < 1 or page_size < 1:
            raise ValueError("page and page_size must be positive")

        params = {
            "key": self._api_key,
            "page": page,
            "page_size": page_size,
        }
        optional_params = {
            "search": search,
            "ordering": ordering,
            "genres": genres,
            "platforms": platforms,
            "dates": dates,
        }
        params.update({key: value for key, value in optional_params.items() if value})

        payload = self._fetch_json(f"{self._base_url}?{urlencode(params)}")

        if not isinstance(payload, dict):
            raise RawgProviderError("RAWG returned an invalid response")

        results = payload.get("results")
        if not isinstance(results, list):
            raise RawgProviderError("RAWG response is missing game results")

        return PaginatedGames(
            games=[self._normalize_game(game) for game in results],
            page=page,
            page_size=page_size,
            total=self._parse_total(payload.get("count")),
        )

    @staticmethod
    def _fetch_json(url: str) -> dict[str, Any]:
        request = Request(url, headers={"Accept": "application/json"})

        try:
            with urlopen(request, timeout=15) as response:
                payload = json.load(response)
        except HTTPError as error:
            raise RawgProviderError(
                f"RAWG request failed with status {error.code}"
            ) from error
        except (URLError, TimeoutError) as error:
            raise RawgProviderError("RAWG request could not be completed") from error
        except json.JSONDecodeError as error:
            raise RawgProviderError("RAWG returned invalid JSON") from error

        if not isinstance(payload, dict):
            raise RawgProviderError("RAWG returned an invalid response")
        return payload

    def _normalize_game(self, game: Any) -> NormalizedGame:
        if not isinstance(game, dict):
            raise RawgProviderError("RAWG returned an invalid game")

        try:
            return NormalizedGame(
                external_id=self._required_id(game),
                external_provider=self._provider_name,
                name=self._required_string(game, "name"),
                slug=self._required_string(game, "slug"),
                description=self._optional_string(
                    game.get("description_raw", game.get("description"))
                ),
                release_date=self._parse_date(game.get("released")),
                rating=self._optional_float(game.get("rating")),
                rating_count=self._optional_int(game.get("ratings_count")),
                metacritic=self._optional_int(game.get("metacritic")),
                cover_image=self._optional_string(
                    game.get("cover_image", game.get("background_image"))
                ),
                background_image=self._optional_string(game.get("background_image")),
                screenshots=self._screenshots(game.get("short_screenshots")),
                genres=self._metadata(game.get("genres")),
                platforms=self._platform_metadata(game.get("platforms")),
            )
        except (KeyError, TypeError, ValueError) as error:
            raise RawgProviderError("RAWG returned an invalid game") from error

    @staticmethod
    def _required_string(game: dict[str, Any], field: str) -> str:
        value = game[field]
        if not isinstance(value, str) or not value:
            raise ValueError(f"RAWG game field {field} is invalid")
        return value

    @staticmethod
    def _required_id(game: dict[str, Any]) -> str:
        value = game["id"]
        if value is None or isinstance(value, bool):
            raise ValueError("RAWG game id is invalid")
        return str(value)

    @staticmethod
    def _optional_string(value: Any) -> str | None:
        return value if isinstance(value, str) else None

    @staticmethod
    def _optional_float(value: Any) -> float | None:
        return float(value) if value is not None else None

    @staticmethod
    def _optional_int(value: Any) -> int | None:
        return int(value) if value is not None else None

    @staticmethod
    def _screenshots(value: Any) -> list[str] | None:
        if not isinstance(value, list):
            return None
        images = [item["image"] for item in value if isinstance(item, dict) and isinstance(item.get("image"), str)]
        return images or None

    @classmethod
    def _metadata(cls, value: Any) -> list[NormalizedMetadata]:
        if not isinstance(value, list):
            return []
        return [
            NormalizedMetadata(
                external_id=cls._optional_id(item.get("id")),
                name=item["name"],
                slug=cls._optional_string(item.get("slug")),
            )
            for item in value
            if isinstance(item, dict)
            and isinstance(item.get("name"), str)
            and item["name"]
        ]

    @classmethod
    def _platform_metadata(cls, value: Any) -> list[NormalizedMetadata]:
        if not isinstance(value, list):
            return []
        return cls._metadata(
            [
                item.get("platform")
                for item in value
                if isinstance(item, dict) and isinstance(item.get("platform"), dict)
            ]
        )

    @staticmethod
    def _optional_id(value: Any) -> str | None:
        if value is None or isinstance(value, bool):
            return None
        return str(value)

    @staticmethod
    def _parse_date(value: Any) -> date | None:
        return date.fromisoformat(value) if isinstance(value, str) and value else None

    @staticmethod
    def _parse_total(value: Any) -> int:
        return int(value) if value is not None else 0
