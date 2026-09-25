# Tindr for Games frontend

React + Vite + TypeScript + Tailwind CSS v4. The frontend talks to the FastAPI backend using an environment-configured API URL and HTTP-only cookie authentication.

## Run it

```bash
cp .env.example .env
npm ci
npm run dev
```

The Vite server uses port 3000 to match the backend's current local CORS origin. Set `VITE_API_URL` in `.env` if the backend runs somewhere else.

For a local visual preview without the backend, run `VITE_MOCK=true npm run dev` (PowerShell: `$env:VITE_MOCK='true'; npm run dev`). Mock data and convenience sign-in behavior are for preview only.

## Main pieces

| Area | Location |
|---|---|
| Ambient WebGL background | `src/components/FluidBackground.tsx` |
| Home discovery content | `src/pages/HomePage.tsx` |
| Glass panels, buttons, and inputs | `src/index.css` |
| Genre and identity colors | `src/lib/genres.ts`, `src/context/ThemeContext.tsx` |
| API client and mock preview | `src/api/client.ts`, `src/api/mock.ts` |
| Page routes | `src/App.tsx`, `src/pages/` |

The app includes Home, Discover, Daily Game, game details and comments, authentication, genre onboarding, profile, and wishlist pages. The root [README](../README.md) describes the backend and local setup.

## Notes

- Do not place `opacity`, `filter`, `mask`, or `mix-blend-mode` on a parent of a glass panel; that changes how backdrop blur renders. Prefer animating the panel or a transform-only wrapper.
- Keep component styles in Tailwind's `@layer components` so utility classes can override them.
- `prefers-reduced-motion` is respected by the ambient background and Framer Motion configuration.
