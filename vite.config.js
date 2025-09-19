import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~public': fileURLToPath(new URL('./public', import.meta.url)),
      '~components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '~assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '~src': fileURLToPath(new URL('./src', import.meta.url)),
      '~img': fileURLToPath(new URL('./src/assets/img', import.meta.url)),
      '~css': fileURLToPath(new URL('./src/assets/css', import.meta.url)),
      '~pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '~layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '~plugins': fileURLToPath(new URL('./src/plugins', import.meta.url)),
      '~router': fileURLToPath(new URL('./src/router', import.meta.url)),
    },
  },
  build: { sourcemap: true },
  server: {
    // allows access from your local network (0.0.0.0)
    host: true,
  },
})
