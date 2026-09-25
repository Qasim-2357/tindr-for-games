# Tindr for Games — Project Context

## 1. Product Vision

Tindr for Games is a game discovery and social platform.

The goal is to help players discover games they may not otherwise find,
save games they are interested in, discuss games with other players, and
receive useful personalized game recommendations.

This is a portfolio-quality software project. It should feel like a
real product, not just a CRUD demonstration.

The product should prioritize:

- Game discovery
- Personalization
- Community discussion
- Useful game information
- AI-assisted recommendations
- Premium, polished UI
- Clean and maintainable engineering

---

## 2. Core MVP Features

### Game Discovery

Users should be able to:

- Explore games
- See trending games
- See popular games
- See new releases
- Search games
- Filter by genre
- Filter by platform
- Navigate through paginated results

### Game Details

The current game detail page shows:

- Name
- Description
- Cover image
- Background image
- Release date
- Rating
- Rating count
- Metacritic score when available
- Screenshots when available
- Wishlist controls
- Comments, replies and likes

### Authentication

Users should be able to:

- Register
- Login
- Logout
- View the current authenticated user
- Edit their profile

Authentication uses JWT with HTTP-only cookies.

Passwords must always be securely hashed and must never be stored as
plaintext.

### Wishlist

Authenticated users can:

- Add games to their wishlist
- Remove games from their wishlist
- View their wishlist

A user must not be able to access or modify another user's wishlist.

Duplicate wishlist entries must be prevented.

### Community

Users can discuss games through:

- Comments
- Threaded replies
- Comment likes

Users can edit or delete their own comments.

Users must not be able to modify another user's comments.

### Genre Identity

Each user can choose a game genre identity.

The selected genre has an associated color.

The identity is displayed in places such as:

- Profile
- Comments
- Replies
- Other appropriate user representations

The genre/color mapping should be centralized rather than duplicated
throughout the frontend.

Example:

Qasim — RPG Explorer

### Tindr AI

Tindr AI should provide useful game recommendations.

Example user request:

"I want a short atmospheric horror game with a strong story."

Gemini extracts the implemented structured preferences:

{
  "required_genres": ["horror"],
  "genre_alternatives": ["psychological horror"],
  "keywords": ["short", "atmospheric", "story"],
  "platforms": []
}

The backend matches and ranks games already stored in PostgreSQL.

The response does not include AI-written explanations.

The AI must not invent games or recommend games that do not exist in
our application data.

The initial recommendation system should be content-based and simple.
Do not introduce complex machine-learning infrastructure for the MVP.

---

## 3. Game Data

RAWG is the only implemented external game metadata provider.

External game APIs must be accessed by the FastAPI backend.

The browser/frontend must NOT directly call RAWG, Steam, Twitch, or other
external game APIs.

RAWG results are normalized and persisted in PostgreSQL. Catalog, search,
trending, popular, new-release, and slug-detail requests currently call RAWG;
daily and recommendation requests use stored database data.

RAWG failures on those provider-backed requests return a service-unavailable
response. Daily and recommendation results do not call RAWG.

Provider-specific code should be isolated so another provider can be added
later without rewriting the game system.

Catalog synchronization follows this path:

Game Router (selects the RAWG provider)
    ↓
`game_catalog.sync_catalog_page`
    ↓
Game Provider
    ↓
RAWG Provider

The slug-detail refresh currently calls the RAWG provider directly from the
router.

The current trending route asks RAWG to order by its "added" signal; the app
does not calculate an independent trending score.

---

## 4. Architecture

Use a modular monolith.

Do NOT turn the MVP into microservices.

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- React Router 6
- Framer Motion
- Lenis
- A WebGL2 ambient background

### Backend

- FastAPI
- Python
- SQLAlchemy 2
- PostgreSQL
- Alembic

### Authentication

- JWT
- HTTP-only cookies

### Testing

- `backend/tests/` uses `unittest` and is run by GitHub Actions.
- GitHub Actions runs `npm ci` and `npm run build` for the frontend.
- No browser automation suite is configured.

### Infrastructure

- Docker
- Git
- GitHub
- GitHub Actions

---

## 5. Development Method

Build using vertical slices.

For meaningful features, prefer:

Database
→ Backend/API
→ Frontend
→ Browser verification

Do not build the entire backend first and postpone frontend integration.

The frontend and backend should be integrated continuously.

API contracts should be established before implementing dependent frontend
features.

When an API changes, inspect and update its consumers rather than silently
creating incompatible duplicate behavior.

---

## 6. API Principles

Use predictable HTTP status codes.

Expected status codes include:

- 200 — successful request
- 201 — resource created
- 204 — successful deletion
- 400 — bad request
- 401 — unauthenticated
- 403 — authenticated but forbidden
- 404 — resource not found
- 409 — conflict
- 422 — validation error
- 500 — unexpected server error

Frontend features should account for:

- Loading states
- Error states
- Empty states
- Successful states

Pagination should be used for potentially large collections.

Do not return an entire game catalog in one API response.

---

## 7. Initial Data Model

The initial application data model includes:

- users
- games
- genres
- platforms
- game_genres
- game_platforms
- wishlists
- comments
- comment_likes

Additional tables may be introduced only when a real requirement
justifies them.

### Games

Important fields include:

- id
- external_id
- external_provider
- name
- slug
- description
- release_date
- rating
- rating_count
- metacritic
- cover_image
- background_image
- screenshots
- created_at
- updated_at

External provider + external ID should uniquely identify an imported game.

### Users

Important fields include:

- id
- username
- email
- password_hash
- identity_genre
- identity_color
- created_at
- updated_at

### Wishlists

A user/game combination should be unique.

### Comments

Comments belong to a game and a user.

Replies use a nullable self-referencing parent_id.

### Comment Likes

A user should only be able to like a specific comment once.

---

## 8. Frontend Routes

The current frontend routes are:

- /
- /auth (registration and sign-in)
- /onboarding
- /discover
- /daily
- /wishlist
- /game/:slug
- /profile

The exact route structure may evolve if there is a concrete technical
reason, but avoid unnecessary route duplication.

---

## 9. Visual Direction

The UI should have a premium dark glassmorphism aesthetic.

Visual principles:

- Near-black background
- Translucent glass surfaces
- Flat UI panels
- Subtle blur
- Soft atmospheric colored glows
- Purple, blue, pink, orange and green can appear as ambient colors
- Background colors should be distant, dim and blurred
- Colors must not overpower the content
- Clean and minimal interface
- Cinematic and futuristic gaming atmosphere

Avoid excessive neon effects, excessive gradients, visual clutter, or
effects that make the interface difficult to use.

Glass panels should remain flat rather than tilted.

---

## 10. Engineering Principles

Prefer simple, production-appropriate solutions.

Follow YAGNI.

Before adding something:

1. Check whether it is actually required.
2. Check whether existing code can be reused.
3. Prefer the standard library or existing dependencies when appropriate.
4. Use the smallest maintainable implementation.

Do not create speculative abstractions.

Do not create generic repositories, services, utilities, wrappers, or
frameworks unless the project actually needs them.

Security, validation, authorization, accessibility and error handling must
not be sacrificed for minimalism.

---

## 11. Explicitly Out of MVP

Do not add these unless explicitly requested:

- Chat
- Friends/following
- Notifications
- WebSockets
- Redis
- Celery
- Kubernetes
- Microservices
- MongoDB
- Elasticsearch
- GraphQL
- Kafka
- Mobile application
- Complex ML recommendation infrastructure
- Admin CMS
- User game uploading

The absence of these technologies is intentional.

---

## 12. AI Coding Assistant Rules

Copilot is an implementation assistant.

It is NOT the project architect.

Before making substantial changes:

- Inspect the existing project.
- Understand the current implementation.
- Follow the established architecture.
- Reuse existing code where appropriate.
- Avoid unnecessary dependencies.
- Avoid redesigning working systems without a concrete reason.
- Keep changes focused on the requested task.

Do not implement future features simply because they are mentioned in this
document.

The developer decides when a feature is actually being implemented.

Do not run tests or Git commands unless explicitly requested. GitHub Actions
currently runs the backend `unittest` suite and frontend production build.

---

## 13. Important Project Rule

This document describes the product direction and architecture.

The actual codebase is the implementation source of truth.

If this document conflicts with an explicitly approved newer architectural
decision, follow the newer approved decision and update the documentation
when appropriate.

Never make large architectural changes based only on assumptions.
