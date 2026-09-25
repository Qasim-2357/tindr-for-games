import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import load_repository_environment

load_repository_environment()

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
if not cors_origins or "*" in cors_origins:
    raise RuntimeError("CORS_ORIGINS must list one or more explicit frontend origins")

from app.routers.auth import router as auth_router
from app.routers.ai import router as ai_router
from app.routers.comments import router as comments_router
from app.routers.games import router as games_router
from app.routers.games import wishlist_router
from app.routers.recommendations import router as recommendations_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def validate_mutation_origin(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("origin")
        if origin is not None and origin not in cors_origins:
            return JSONResponse(
                status_code=403,
                content={"detail": "Request origin is not allowed"},
            )
    return await call_next(request)


app.include_router(games_router)
app.include_router(wishlist_router)
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(comments_router)
app.include_router(recommendations_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
