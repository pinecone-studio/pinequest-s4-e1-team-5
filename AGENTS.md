# Repository Guidelines

## Project Structure & Module Organization

This repository is split into two apps:

- `client/`: Vite + React + TypeScript frontend. Main source lives in `client/src`.
- `client/src/components/canvas`: React Three Fiber scene components.
- `client/src/components/ui`, `components/dom`: browser UI and DOM overlays.
- `client/src/context`, `hooks`, `utils`, `lib`: shared state, reusable logic, utilities, and API helpers.
- `client/src/styles`: SCSS entry points and partials.
- `client/public`: static assets served by Vite, including `textures/`, `images/`, `fonts/`, `sounds/`, and `cursors/`.
- `server/`: Bun + Hono API. Routes are in `server/src/router`, controllers in `server/src/controller`, services in `server/src/service`.

## Build, Test, and Development Commands

Run commands from the relevant app directory using Bun.

```sh
cd client
bun run dev        # Start Vite on localhost:3000, or the next free port
bun run build      # Production Vite build
bun run typecheck  # TypeScript no-emit check
bun run lint       # ESLint check
bun run preview    # Preview built client
```

```sh
cd server
bun run dev        # Start Hono API with hot reload
bun run start      # Start API without hot reload
```

## Coding Style & Naming Conventions

Use TypeScript and ES modules. Follow existing style: two-space indentation in JSON, single quotes in most React/TS files, PascalCase for React components, camelCase for functions and variables, and SCSS partial names that match the UI surface. Keep Three.js scene code scoped under `components/canvas`; keep DOM overlays under `components/ui` or `components/dom`. Public asset references should use absolute Vite paths such as `/textures/corridor/file.webp`.

## Testing Guidelines

There is no formal test suite configured yet. Before opening a PR, run `npm run build`, `npm run typecheck`, and `npm run lint` in `client`. For asset-heavy changes, verify referenced files exist under `client/public` and smoke-test the local app in a browser. Server changes should be checked by starting `bun run dev` and exercising the affected API route.

## Commit & Pull Request Guidelines

Recent history uses short, informal commits plus merge commits. Prefer clearer imperative messages, for example `Fix corridor texture preload` or `Remove tutor widget`. PRs should include a concise summary, affected areas (`client`, `server`, assets), verification commands, screenshots for UI changes, and any environment variables or backend services needed to reproduce.

## Security & Configuration Tips

Do not commit secrets. Client config comes from Vite env values such as `VITE_API_URL` and `VITE_POSTHOG_KEY`; server integrations may require database, OpenAI, or Wolfram credentials. Document new variables in the relevant README or PR.
