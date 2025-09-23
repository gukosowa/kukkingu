import { puppeteerLauncher } from '@web/test-runner-puppeteer';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  browsers: [
    // Use bundled Chromium via Puppeteer
    puppeteerLauncher({ launchOptions: { args: ['--no-sandbox', '--disable-dev-shm-usage'] } }),
  ],
  nodeResolve: true,
  middleware: [
    function importMap(ctx, next) {
      if (ctx.path === '/import-map.json') {
        ctx.type = 'application/json';
        ctx.body = JSON.stringify(JSON.parse(require('fs').readFileSync('./import-map.json', 'utf8')));
        return;
      }
      return next();
    },
  ],
  plugins: [
    esbuildPlugin({
      ts: true,
      tsx: true,
      target: 'es2020',
    }),
  ],
  files: ['src/**/*.test.{ts,js}'],
};
