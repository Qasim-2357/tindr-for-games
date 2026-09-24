from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.recommendations import get_recommendations


router = APIRouter(tags=["recommendations"])


class RecommendationGameResponse(BaseModel):
    id: int
    name: str
    slug: str
    cover_image: str | None
    rating: float | None
    release_date: date | None


class RecommendationsResponse(BaseModel):
    items: list[RecommendationGameResponse]
    page: int
    page_size: int
    total: int


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_user_recommendations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationsResponse:
    recommendation_page = get_recommendations(
        db,
        current_user.id,
        page=page,
        page_size=page_size,
    )
    return RecommendationsResponse(
        items=[
            RecommendationGameResponse(
                id=game.id,
                name=game.name,
                slug=game.slug,
                cover_image=game.cover_image,
                rating=game.rating,
                release_date=game.release_date,
            )
            for game in recommendation_page.games
        ],
        page=recommendation_page.page,
        page_size=recommendation_page.page_size,
        total=recommendation_page.total,
    )
