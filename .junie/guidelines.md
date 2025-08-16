# Development Guidelines (Project-Specific)

These notes are targeted at advanced developers working on this repository. They capture the current state of build, configuration, testing, and conventions specific to this project.

## Build, Dev, and Configuration

- Tooling stack
  - Vite + Svelte 4 with `@sveltejs/vite-plugin-svelte`
  - TypeScript 5 in the app (no type-emitting; Vite handles TS transpilation)
  - Tailwind CSS 3 via PostCSS
  - Path aliases configured in both Vite and TS
  - Sourcemaps are enabled in production builds for debugging

- Commands (package.json)
  - `npm run dev` (or `pnpm dev`): Vite dev server
  - `npm run build`: Production bundle to `dist/`
  - `npm run preview`: Static preview of the production build
  - `npm run test`: Browser-based tests via `@web/test-runner`

- Vite configuration (vite.config.ts)
  - Svelte plugin configured with `svelte-preprocess`:
    - `defaults: { script: 'typescript' }` so `<script lang="ts">` is optional
    - `postcss: true` to pipe styles through PostCSS/Tailwind
    - `compilerOptions: { hydratable: true }` (SSR/hydration compatible components)
  - Path aliases available at runtime/build:
    - `~public` → `/public`
    - `~components` → `/src/components`
    - `~assets` → `/src/assets`
    - `~src` → `/src`
    - `~img` → `/src/assets/img`
    - `~css` → `/src/assets/css`
    - `~pages` → `/src/pages`
    - `~layouts` → `/src/layouts`
    - `~plugins` → `/src/plugins`
    - `~router` → `/src/router`
  - `build: { sourcemap: true }` for debugging production builds

- TypeScript configuration (tsconfig.json)
  - `module`/`target`: `ESNext`, `moduleResolution: bundler`
  - `types`: includes `svelte` and `vite/client`
  - TS path aliases mirror the Vite aliases; prefer using the aliased imports for consistency
  - `noEmit: true` — Vite performs compilation; use `svelte-check` for diagnostics

- PostCSS/Tailwind
  - `postcss.config.js`: Tailwind and Autoprefixer enabled
  - `tailwind.config.js`:
    - `content` scans `./src/**/*.{html,js,svelte,ts}`
    - `safelist` for dynamic background color classes: `/^bg-pink-/, /^bg-green-/, /^bg-red-/, /^bg-gray-/`
    - Extends theme with `orange[500] = #ff3e00`

- Svelte preprocess (svelte.config.js)
  - Also configures PostCSS with `postcss-preset-env`, Tailwind, Autoprefixer. Note: Vite-side `postcss: true` means each Svelte file’s style block goes through PostCSS.

- SPA and assets
  - The app is a Svelte SPA with `svelte-spa-router` and `svelte-i18n`.
  - Markdown rendering uses `marked` and styles via `github-markdown-css`.
  - Service worker registration is maintained in `src/index.js` (see README notes).

## Testing

This project uses `@web/test-runner` for browser-native ESM tests.

- Current setup
  - Config: `web-test-runner.config.js` is intentionally minimal and ESM-based:
    ```js
    export default {
      // Minimal configuration; JS tests run without plugins.
    };
    ```
  - Script: `npm run test` resolves pattern `src/**/*.test.{js,ts}`.
  - Because the config does not include a TS transpiler or Node-resolve plugin, tests should currently be authored in plain JS (ESM). If you want to write tests in TypeScript or import bare Node-style specifiers, see “TypeScript tests” below.

- Running tests
  - `npm run test`
  - Headless Chrome is used by default; open in debug mode by appending `--watch` or `--manual` to the command if interactive debugging is needed.

- Creating new tests (current constraints)
  - Place tests under `src/` and name them `*.test.js` (or `.ts` once TS support is enabled as described below).
  - Use ESM with relative imports only (e.g., `import x from './module.js'`). Bare module imports like `import { expect } from 'chai'` will fail without additional plugins. For simple assertions, throwing an `Error` is sufficient and avoids the dependency on assertion libraries.
  - Example (verified):
    ```js
    // src/example.test.js
    describe('runtime smoke', () => {
      it('adds numbers', () => {
        const sum = [1, 2, 3].reduce((a, b) => a + b, 0);
        if (sum !== 6) throw new Error(`expected 6, got ${sum}`);
      });

      it('has DOM available', () => {
        const div = document.createElement('div');
        div.id = 'root';
        document.body.appendChild(div);
        if (document.getElementById('root') !== div) throw new Error('DOM not available');
      });
    });
    ```
  - The above pattern was executed successfully during verification.

- TypeScript tests (optional enhancement)
  - If you want `.test.ts` files or bare module imports (e.g., `chai`) to work, install and configure one of the following:
    - `@web/dev-server-esbuild` for TS transpilation and bare import resolution, or
    - `@web/dev-server-rollup` plus appropriate plugins.
  - Minimal example using esbuild:
    ```bash
    npm i -D @web/dev-server-esbuild
    ```
    ```js
    // web-test-runner.config.js
    import { esbuildPlugin } from '@web/dev-server-esbuild';
    export default {
      plugins: [esbuildPlugin({ ts: true, tsx: true })],
    };
    ```
  - With that in place you can write:
    ```ts
    import { expect } from '@esm-bundle/chai'; // or configure node-resolve to use chai
    expect(2 + 2).to.equal(4);
    ```

## Additional Development Notes

- Formatting / Style
  - Prettier is included with `prettier-plugin-svelte`. Use your editor’s Prettier integration. No ESLint is configured in this repo.

- Type checking
  - Use `npx svelte-check` (or add a script) for Svelte-aware diagnostics. TS compiler is set to `noEmit` and relies on Vite for transpilation.

- Module resolution & aliases
  - Prefer using the path aliases listed above. When testing (without dev-server plugins), import source relatively from tests (e.g., `import { foo } from '../foo.js'`).

- CSS pipeline
  - Tailwind + PostCSS are wired both via global PostCSS config and Svelte preprocess. Ensure components rely on classes rather than deep selectors where possible; purge relies on the `content` globs and the safelist.

- SSR/Hydration considerations
  - Components are compiled with `hydratable: true`. While the app is configured as an SPA, avoid hydration-unsafe side effects in component top-level code.

- Build outputs and debugging
  - Production build has sourcemaps enabled. You can debug production issues by serving `dist/` with `npm run preview` and using browser devtools with original sources.

- Internationalization and routing
  - `svelte-i18n` loading can introduce async boundaries. Initialize i18n early (e.g., root component or router init) to avoid FOUC. When adding routes, keep in mind the Vite dev server’s SPA fallback is automatic; ensure links work with router and do not rely on server rewrites.

- Markdown rendering
  - `marked` is used for rendering. If you add user-provided Markdown, ensure proper sanitization upstream (not handled here by default). Styles are provided via `github-markdown-css`.

- Service worker
  - Service worker registration remains in `src/index.js`. If you modify assets or caching behavior, ensure registration/unregistration logic is updated accordingly.

## Verified Steps Performed for This Document

- Updated `web-test-runner.config.js` to ESM and minimal (removed legacy Snowpack plugin).
- Broadened test script to include JS tests: `src/**/*.test.{js,ts}`.
- Created a temporary `src/smoke.test.js`, ran `npm run test`, and verified passing tests in headless Chrome.
- Removed the temporary test file to keep the repository clean, as per instructions.
