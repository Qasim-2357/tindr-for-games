from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_repository_environment

load_repository_environment()

from app.routers.auth import router as auth_router
from app.routers.games import router as games_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(games_router)
app.include_router(auth_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}