# Kukkingu

Vue 3 SPA using Vite, Tailwind 3, and TypeScript 5.

## Scripts

- `dev`: start Vite dev server.
- `build`: production build to `dist/`.
- `preview`: preview the production build locally.
- `test`: run tests via web-test-runner.

Use your package manager of choice:

- pnpm: `pnpm dev`, `pnpm build`, `pnpm preview`
- npm: `npm run dev`, `npm run build`, `npm run preview`

## Notes

- Entry HTML lives at project root `index.html` (Vite convention).
- Aliases mirror legacy Snowpack aliases via Vite config and TS `paths`.
- Tailwind uses `content` scanning and a safelist for dynamic bg classes.
- Service worker registers from `/service-worker.js` in `main.ts`.

## Folder Structure

- `src/` app source (Vue components, router, store, i18n, etc.)
- `public/` static assets (favicon, manifest, etc.)
- `dist/` build output (generated)
