from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.ai_preferences import AIPreferenceExtractionError
from app.services.ai_recommendations import AIRecommendationService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])


class AIRecommendationRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)


class AIRecommendationGameResponse(BaseModel):
    id: int
    name: str
    slug: str
    cover_image: str | None
    rating: float | None
    release_date: date | None


class AIRecommendationsResponse(BaseModel):
    query: str
    items: list[AIRecommendationGameResponse]
    page: int
    page_size: int
    total: int


@router.post("/recommendations", response_model=AIRecommendationsResponse)
def create_ai_recommendations(
    payload: AIRecommendationRequest,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AIRecommendationsResponse:
    if not payload.query.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A game preference query is required",
        )

    try:
        result = AIRecommendationService().recommend(
            db,
            payload.query,
            current_user.id,
            page=page,
            page_size=page_size,
        )
    except AIPreferenceExtractionError as error:
        logger.exception("AI preference extraction failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI recommendations are currently unavailable",
        ) from error
    except RuntimeError as error:
        logger.exception("AI recommendation request failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI recommendations are currently unavailable",
        ) from error

    return AIRecommendationsResponse(
        query=payload.query,
        items=[
            AIRecommendationGameResponse(
                id=game.id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image,
                rating=game.rating,
                release_date=game.release_date,
            )
            for game in result.games
        ],
        page=result.page,
        page_size=result.page_size,
        total=result.total,
    )
