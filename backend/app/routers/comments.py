from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_optional_current_user
from app.database import get_db
from app.models.comment import Comment
from app.models.comment_like import CommentLike
from app.models.game import Game
from app.models.user import User

router = APIRouter(tags=["comments"])


class CommentRequest(BaseModel):
    content: str = Field(max_length=2000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("Content cannot be empty")
        return content


class CommentUserResponse(BaseModel):
    id: int
    username: str
    identity_genre: str | None
    identity_color: str | None


class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user: CommentUserResponse
    like_count: int
    liked_by_me: bool
    replies: list["CommentResponse"] = Field(default_factory=list)


class CommentsResponse(BaseModel):
    items: list[CommentResponse]
    page: int
    page_size: int
    total: int


class CommentLikeResponse(BaseModel):
    liked: bool
    like_count: int


def _comment_content(comment: Comment) -> str:
    return "This comment was deleted." if comment.deleted_at is not None else comment.content


def _comment_responses(
    db: Session,
    comments: list[Comment],
    current_user_id: int | None,
    replies_by_parent: dict[int, list[Comment]] | None = None,
) -> list[CommentResponse]:
    if not comments:
        return []

    all_comments = list(comments)
    if replies_by_parent:
        for replies in replies_by_parent.values():
            all_comments.extend(replies)

    user_ids = {comment.user_id for comment in all_comments}
    users = {
        user.id: user
        for user in db.scalars(select(User).where(User.id.in_(user_ids))).all()
    }
    comment_ids = {comment.id for comment in all_comments}
    like_counts = dict(
        db.execute(
            select(CommentLike.comment_id, func.count(CommentLike.id))
            .where(CommentLike.comment_id.in_(comment_ids))
            .group_by(CommentLike.comment_id)
        ).all()
    )
    liked_ids: set[int] = set()
    if current_user_id is not None:
        liked_ids = set(
            db.scalars(
                select(CommentLike.comment_id).where(
                    CommentLike.user_id == current_user_id,
                    CommentLike.comment_id.in_(comment_ids),
                )
            ).all()
        )

    def response_for(comment: Comment, include_replies: bool) -> CommentResponse:
        user = users[comment.user_id]
        return CommentResponse(
            id=comment.id,
            content=_comment_content(comment),
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            user=CommentUserResponse(
                id=user.id,
                username=user.username,
                identity_genre=user.identity_genre,
                identity_color=user.identity_color,
            ),
            like_count=like_counts.get(comment.id, 0),
            liked_by_me=comment.id in liked_ids,
            replies=(
                [
                    response_for(reply, include_replies=False)
                    for reply in replies_by_parent.get(comment.id, [])
                ]
                if include_replies and replies_by_parent
                else []
            ),
        )

    return [response_for(comment, replies_by_parent is not None) for comment in comments]


def _get_comment_or_404(db: Session, comment_id: int) -> Comment:
    comment = db.scalar(select(Comment).where(Comment.id == comment_id))
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.get("/games/{game_id}/comments", response_model=CommentsResponse)
def get_comments(
    game_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> CommentsResponse:
    game = db.scalar(select(Game).where(Game.id == game_id))
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    total = db.scalar(
        select(func.count(Comment.id)).where(
            Comment.game_id == game_id,
            Comment.parent_id.is_(None),
        )
    ) or 0
    top_level_comments = list(
        db.scalars(
            select(Comment)
            .where(
                Comment.game_id == game_id,
                Comment.parent_id.is_(None),
            )
            .order_by(Comment.created_at.asc(), Comment.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    comment_ids = [comment.id for comment in top_level_comments]
    replies_by_parent: dict[int, list[Comment]] = {}
    if comment_ids:
        replies = db.scalars(
            select(Comment)
            .where(Comment.parent_id.in_(comment_ids))
            .order_by(Comment.created_at.asc(), Comment.id.asc())
        ).all()
        for reply in replies:
            replies_by_parent.setdefault(reply.parent_id, []).append(reply)

    return CommentsResponse(
        items=_comment_responses(
            db,
            top_level_comments,
            current_user.id if current_user else None,
            replies_by_parent,
        ),
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post(
    "/games/{game_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    game_id: int,
    payload: CommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentResponse:
    if db.scalar(select(Game.id).where(Game.id == game_id)) is None:
        raise HTTPException(status_code=404, detail="Game not found")

    comment = Comment(game_id=game_id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_responses(db, [comment], current_user.id)[0]


@router.post(
    "/comments/{comment_id}/replies",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reply(
    comment_id: int,
    payload: CommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentResponse:
    parent = _get_comment_or_404(db, comment_id)
    if parent.parent_id is not None:
        raise HTTPException(status_code=400, detail="Replies to replies are not allowed")

    reply = Comment(
        game_id=parent.game_id,
        user_id=current_user.id,
        parent_id=parent.id,
        content=payload.content,
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return _comment_responses(db, [reply], current_user.id)[0]


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    payload: CommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentResponse:
    comment = _get_comment_or_404(db, comment_id)
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the comment owner can edit it")
    if comment.deleted_at is not None:
        raise HTTPException(status_code=409, detail="Deleted comments cannot be edited")

    comment.content = payload.content
    db.commit()
    db.refresh(comment)
    return _comment_responses(db, [comment], current_user.id)[0]


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    comment = _get_comment_or_404(db, comment_id)
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the comment owner can delete it")
    if comment.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Comment already deleted")

    comment.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post(
    "/comments/{comment_id}/like",
    response_model=CommentLikeResponse,
)
def like_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentLikeResponse:
    _get_comment_or_404(db, comment_id)
    existing = db.scalar(
        select(CommentLike).where(
            CommentLike.comment_id == comment_id,
            CommentLike.user_id == current_user.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Comment is already liked")

    db.add(CommentLike(comment_id=comment_id, user_id=current_user.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Comment is already liked") from None

    like_count = db.scalar(
        select(func.count(CommentLike.id)).where(CommentLike.comment_id == comment_id)
    ) or 0
    return CommentLikeResponse(liked=True, like_count=like_count)


@router.delete("/comments/{comment_id}/like", response_model=CommentLikeResponse)
def unlike_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentLikeResponse:
    _get_comment_or_404(db, comment_id)
    like = db.scalar(
        select(CommentLike).where(
            CommentLike.comment_id == comment_id,
            CommentLike.user_id == current_user.id,
        )
    )
    if like is None:
        raise HTTPException(status_code=404, detail="Comment is not liked")

    db.execute(delete(CommentLike).where(CommentLike.id == like.id))
    db.commit()
    like_count = db.scalar(
        select(func.count(CommentLike.id)).where(CommentLike.comment_id == comment_id)
    ) or 0
    return CommentLikeResponse(liked=False, like_count=like_count)
