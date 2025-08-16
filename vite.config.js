import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        defaults: { script: 'typescript' },
        postcss: true,
      }),
      compilerOptions: { hydratable: true },
    }),
  ],
  resolve: {
    alias: {
      '~public': '/public',
      '~components': '/src/components',
      '~assets': '/src/assets',
      '~src': '/src',
      '~img': '/src/assets/img',
      '~css': '/src/assets/css',
      '~pages': '/src/pages',
      '~layouts': '/src/layouts',
      '~plugins': '/src/plugins',
      '~router': '/src/router',
    },
  },
  build: { sourcemap: true },
})
