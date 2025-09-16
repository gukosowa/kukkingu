# Repository Guidelines

## Project Structure & Module Organization

* `index.html`: Vite entry HTML.
* `src/`: app code (Vue 3 + TS, Tailwind).

  * `components/`: UI components (prefer PascalCase, e.g., `Header.vue`).
  * `router/`: Vue Router setup (`index.ts`).
  * `assets/`: CSS, images; Tailwind under `~css/`.
  * `i18n/`, `services/`, `store/`, `plugins/`: app modules.
* `public/`: static files served as-is.
* Aliases: `~components`, `~assets`, `~css`, `~router`, etc. Example:
  `import Header from '~components/Header.vue'`.

## Build, Test, and Development Commands

* `npm run dev`: start Vite dev server with HMR.
* `npm run build`: production build to `dist/` (sourcemaps enabled).
* `npm run preview`: preview the production build locally.
* **Tests are disabled**: no test runner is configured, and `npm test` should not be used.

## Coding Style & Naming Conventions

* Language: TypeScript (strict) + Vue 3 SFCs (`<script setup lang="ts">`).
* Indentation: 2 spaces; quotes: single; semicolons: none (Prettier).
* Component files: PascalCase `.vue`; utilities/composables in `services/` or `store/`.
* Imports use configured aliases (see `vite.config.js`, `tsconfig.json`).
* Lint/format: ESLint + Prettier. Run your editor integrations before committing.
* Tailwind: prefer utility classes; dynamic bg-\* allowed via safelist.

## Testing Guidelines

* **No tests should run**. The project does not include `@web/test-runner` or any test setup.
* Do not add `.test.{js,ts}` files.
* If needed, tests can be reintroduced later, but they are intentionally disabled for now.

## Commit & Pull Request Guidelines

* Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, etc. Avoid `wip`.
* Keep commits scoped and focused; write imperative subject lines.
* PRs: include a clear description, linked issues, screenshots for UI changes, and a short test plan.
* CI hygiene: ensure `npm run build` passes locally before opening a PR.

## Security & Configuration Tips

* Service worker registers from `/service-worker.js`; verify behavior when changing caching or routes.
