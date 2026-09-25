# Tindr for Games

Tindr for Games is a personalized game discovery app. Players can explore a catalog, describe the kinds of games they want, build a wishlist, and tune the product's accent color to their chosen genre.

## What it does

- Browse and search games by genre and platform, and explore trending, popular, and new-release lists.
- Explore games for a chosen genre identity and get recommendations ranked from genres across a player's wishlist.
- Ask for AI recommendations in natural language. Gemini extracts structured preferences; the backend uses them to filter and rank games already in the catalog.
- Explore a daily selection, view game details and screenshots, and read or write comments and replies.
- Register and sign in, choose an identity genre/color, and save games to a personal wishlist.

## Stack and structure

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, and a WebGL2 ambient background.
- `backend/`: FastAPI, SQLAlchemy, Pydantic, and provider/service/router modules.
- PostgreSQL stores users, normalized game data, genres, platforms, wishlists, comments, and likes. Alembic manages schema migrations.
- RAWG is the external game-data provider. Its responses are normalized and persisted through the provider and catalog services.
- Gemini is used for preference extraction in the AI recommendation flow. It does not invent catalog entries; matching and ranking happen against stored games.
- Authentication uses Argon2 password hashes and JWTs in HTTP-only cookies.

## Run locally

1. Copy `.env.example` to `.env`. Set `RAWG_API_KEY`, `GEMINI_API_KEY`, and a long random `JWT_SECRET_KEY`. The sample PostgreSQL credentials are for local development only.
2. Start PostgreSQL: `docker compose up -d db`.
3. Create and activate a Python virtual environment, then install the backend requirements:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   ```

4. Start the backend from `backend/`:

   ```bash
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

5. In a second terminal, copy `frontend/.env.example` to `frontend/.env`, then start the frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

Open `http://localhost:3000`. The backend allows the origin listed in `CORS_ORIGINS`, which defaults to `http://localhost:3000`.

For a UI preview without the backend, run `VITE_MOCK=true npm run dev` from `frontend/` (PowerShell: `$env:VITE_MOCK='true'; npm run dev`). Mock data is for local preview only.

## Environment variables

- Root `.env`: either `DATABASE_URL` or the `POSTGRES_*` settings, plus `RAWG_API_KEY`, `GEMINI_API_KEY`, `JWT_SECRET_KEY`, `JWT_EXPIRE_MINUTES`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, and `CORS_ORIGINS`.
- `frontend/.env`: `VITE_API_URL`, which points to the FastAPI server (defaults to `http://localhost:8000` in the client).

For production, set a long random `JWT_SECRET_KEY`, `AUTH_COOKIE_SECURE=true`, `VITE_API_URL` to the public API origin, and `CORS_ORIGINS` to the exact frontend origin(s). `AUTH_COOKIE_SAMESITE=lax` works when the frontend and API use the same site (for example, separate subdomains of one custom domain). Different sites require `AUTH_COOKIE_SAMESITE=none` and HTTPS; unsafe browser requests are checked against the CORS origin allowlist. Keep RAWG and Gemini keys in backend environment variables, never `VITE_*` variables.

See [frontend/README.md](frontend/README.md) for frontend-specific notes.
