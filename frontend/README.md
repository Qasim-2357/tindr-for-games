# Tindr for Games: frontend

React + Vite + TypeScript + Tailwind v4 + Framer Motion.
Talks to the existing FastAPI backend. **The backend is not modified.**

## Run it

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm run dev               # http://localhost:3000
```

Start the backend separately (`uvicorn app.main:app --reload --port 8000`).

## Two things the backend forces

1. **Port 3000.** `app/main.py` only allows CORS from `http://localhost:3000`, so `vite.config.ts` pins the dev server to 3000 with `strictPort`. Open the app at `http://localhost:3000`, not `127.0.0.1:3000`.
2. **Cookie auth.** Login sets an httpOnly `access_token` cookie, so every request uses `credentials: "include"` (see `src/api/client.ts`). The token lasts 30 minutes by default (`JWT_EXPIRE_MINUTES`), after which the app returns to the sign-in screen.

## How the vision maps to code

| Feature | File |
|---|---|
| Glowing neon-ring background | `src/components/FluidBackground.tsx` |
| Glassmorphism system, buttons, inputs | `src/index.css` (`@layer components`) |
| Cursor / touch glow + click ripple | `src/components/ClickBloom.tsx` |
| Genre colours (matches backend `IDENTITY_GENRE_COLORS`) | `src/lib/genres.ts` |
| Site re-lights in your genre colour | `src/context/ThemeContext.tsx` |
| Fetch client for every backend endpoint | `src/api/client.ts` |

The app includes a public home page, authentication and genre onboarding, protected
discovery with search, genre/platform filters, trending, popular and new-release
tabs, game detail pages, and an editable user profile.

## Visual preview without a backend

`VITE_MOCK=true npm run dev` runs the whole UI against fake data (`src/api/mock.ts`).

## Rules to keep the glass working

- Never put `opacity`, `filter`, `mask` or `mix-blend-mode` on a **parent** of a glass element. Browsers then blur only that parent's content and the orbs stop showing through. Animate the glass element itself, or animate `transform` on parents.
- Put custom CSS in `@layer components` so Tailwind utilities can override it.

## Known backend limits (frontend works around them)

- RAWG has no "horror" genre, so the Horror colour searches for `horror` instead of using `genres=`.
- The backend has no like/swipe/library endpoints yet, so there's no swipe UI. `GameCard` is ready to host one when you add them.
