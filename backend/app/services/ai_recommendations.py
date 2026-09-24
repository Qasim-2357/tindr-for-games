from sqlalchemy.orm import Session

from app.services.ai_game_search import AIGameSearchPage, search_games_by_preferences
from app.services.ai_preferences import AIPreferenceService


class AIRecommendationService:
    def __init__(self, preference_service: AIPreferenceService | None = None) -> None:
        self._preference_service = preference_service or AIPreferenceService()

    def recommend(
        self,
        db: Session,
        query: str,
        user_id: int,
        *,
        page: int = 1,
        page_size: int = 10,
    ) -> AIGameSearchPage:
        preferences = self._preference_service.extract(query)
        return search_games_by_preferences(
            db,
            preferences,
            user_id=user_id,
            page=page,
            page_size=page_size,
        )
