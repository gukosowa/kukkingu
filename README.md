# Kukkingu

Kukkingu is a lightweight recipe manager built with **Vue 3**, **Vite**,
**Tailwind CSS**, and **TypeScript**. Data is stored locally (in
`localStorage`), and a service worker is registered for offline use.

## Features

- Create, rename, reorder, and delete recipes
- Ingredient checklist with portion scaling
- Markdown-based notes for each recipe
- Localized interface (Japanese & English)
- Service worker caching for production builds

## Netlify
`npm install -g netlify-cli`

## DB
Run `npx netlify db init`
See https://app.netlify.com/extensions/neon



## Quick Start

```bash
npm install
npm run dev       # start development server
npm test          # run unit tests
npm run build     # create production build in dist/
npm run preview   # preview the build locally
```

pnpm equivalents are also supported (`pnpm dev`, `pnpm build`, ...).

## Project Structure

- `index.html` – Vite entry point
- `src/` – application source
  - `components/` – Vue components (PascalCase `.vue`)
  - `router/` – Vue Router configuration
  - `store/` – reactive state and persistence helpers
  - `i18n/` – localization messages and helpers
  - `plugins/`, `services/` – utilities and integrations
- `public/` – static files served as-is (icons, manifest, service worker)
- `dist/` – generated production build

## Contributing

This project uses ESLint and Prettier with two-space indentation, single
quotes, and no semicolons. Commit messages follow **Conventional
Commits**. Run `npm test` and `npm run build` before submitting a PR.
