# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

PineQuest is an interactive 3D educational experience for Mongolian school students. The client renders a navigable 3D corridor with rooms for Math, Physics, Geometry, and Chemistry. Each room connects to an AI tutor backed by OpenAI (gpt-4.1-mini) that answers in Mongolian and verifies results via WolframAlpha. The experience uses a sketch/paper visual style with painted-on-hover variants for textures.

## Commands

Run all commands with `bun` from the relevant subdirectory.

**Client (`cd client`)**
```sh
bun run dev        # Vite dev server on localhost:3000
bun run build      # Production build
bun run typecheck  # TypeScript no-emit check
bun run lint       # ESLint check
bun run preview    # Preview built output
```

**Server (`cd server`)**
```sh
bun run dev        # Hono API with hot reload on port 4000
bun run start      # Without hot reload
```

There is no formal test suite. Pre-PR checks: `bun run build`, `bun run typecheck`, and `bun run lint` in `client`.

## Architecture

### Client

The entry point ([client/src/main.tsx](client/src/main.tsx)) mounts `<App>` wrapped in `PerformanceProvider` and `AchievementsProvider`. `AppContent` then wraps everything in `AudioProvider` and `SceneProvider` before mounting the R3F `<Canvas>`.

**Scene rendering flow:**
1. `<Canvas>` renders `<Experience>` (lazy-loaded) with a `<PerformanceMonitor>` that auto-downgrades the performance tier.
2. `Experience` mounts `InfiniteCorridorManager` (scrollable procedural corridor) plus entrance components before the user enters.
3. When a door is clicked, `SceneContext` manages a teleport state machine (`closing → teleporting → opening`) coordinated between `TeleportRoom`, `PaperTransition`, and the individual room components.
4. Subject rooms live in `components/canvas/rooms/{Chemistry,Geometry,Mathematic,Physics}/`.

**State via React Context:**
- `SceneContext` — room navigation, teleport phases, overlay content. The teleport state machine is: `pendingDoorClick` triggers `closing`, then `teleporting`, then `opening`, then `null`. Use `useScene()` to access.
- `PerformanceContext` — detects device capability and exposes a `tier` (HIGH/MEDIUM/LOW) with matching renderer settings (DPR, shadows, antialias). Downgrades automatically via `PerformanceMonitor`.
- `AudioManager` / `audioManager.ts` — audio is initialized on first user interaction; `AudioProvider` wraps the context; utility functions live in `utils/audioManager.ts`.
- `AchievementsContext` — tracks user achievements; `AchievementPopup` and `AchievementsPanel` consume it.

**Custom camera hooks (`hooks/`):**
- `useInfiniteCamera` — scrolls and wraps the camera through repeating corridor segments; disabled while inside a room or teleporting.
- `useScrollCamera`, `useParallax`, `useMouseParallax` — lower-level helpers used by the corridor.

**Textures:**
- All static assets are under `client/public/` and referenced with absolute paths like `/textures/corridor/wall_texture.webp`.
- `config/texturePreloadList.ts` groups textures by area (`ENTRANCE_TEXTURES`, `CORRIDOR_TEXTURES`, etc.). `filterTexturesByDevice` strips `_painted.webp` variants on non-hover devices.
- Preloading happens at module level in `App.tsx` before React renders.

**Custom shaders:** `components/canvas/shaders/` has `RevealMaterial`, `RevealBasicMaterial`, and `PaintRevealMaterial` — GLSL-based materials for the paint-reveal hover effect on textures.

**API layer:** All server calls go through `lib/api.ts`, which uses `apiFetch` with `VITE_API_URL` (defaults to `http://localhost:4000`).

### Server

Built with Bun + Hono. Entry point: `server/src/index.ts`. Mounts four routers:

| Prefix | Router | Domain |
|---|---|---|
| `/api/tutor` | `tutor.router.ts` | AI problem solving, history, examples, practice |
| `/api/formulas` | `formula.router.ts` | Formula reference data from DB |
| `/api/quiz` | `quiz.router.ts` | AI-generated quiz questions |
| `/api/studio` | `studio.router.ts` | Studio content search/titles |

**Key server patterns:**
- `db.ts` exports `sql` (a Neon serverless client). The `solved_problems` table is created lazily on first tutor solve via `ensureSolvedProblemsSchema()` (singleton promise).
- `openai.ts` exports the OpenAI client. All AI calls use `openai.responses.create` (Responses API), not the Chat Completions API, with strict JSON schema output (`text.format.type = "json_schema"`).
- `wolfram.service.ts` calls the WolframAlpha API and returns structured pods. Results are translated to Mongolian by a second OpenAI call before being stored.
- Duplicate problem submissions are deduplicated by exact text match (case/whitespace insensitive) against `solved_problems`.

## Environment variables

**Server** (`server/.env`):
- `PORT` — default 4000
- `CLIENT_URL` — default `http://localhost:3000`
- `DATABASE_URL` — Neon PostgreSQL connection string
- `OPENAI_API_KEY`
- `WOLFRAM_APP_ID`

**Client** (`.env` in `client/`, prefixed `VITE_`):
- `VITE_API_URL` — server URL, defaults to `http://localhost:4000`
- `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` — analytics

## Conventions

- Single quotes in TS/TSX; two-space indent in JSON.
- Three.js scene code belongs in `components/canvas/`; DOM overlays in `components/ui/` or `components/dom/`.
- SCSS partials in `styles/` are named to match the component they style. Shared variables/mixins live in `_variables.scss` and `_mixins.scss`.
- The AI tutor always responds in Mongolian. Preserve Cyrillic text, formulas, chemical symbols, and units unchanged across OpenAI calls.
