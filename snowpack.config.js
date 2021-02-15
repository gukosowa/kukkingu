const rollupPluginSvelte = require('rollup-plugin-svelte')

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  plugins: [
    '@snowpack/plugin-babel',
    [
      '@snowpack/plugin-build-script',
      {
        cmd: 'postcss',
        input: ['.css', '.pcss'],
        output: ['.css'],
      },
    ],
    [
      '@snowpack/plugin-svelte',
      {
        compilerOptions: {
          hydratable: true,
        },
      },
    ],
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    // { match: 'routes', src: '.*', dest: '/index.html' },
  ],
  optimize: {
    /* Example: Bundle your final build: */
    bundle: true,
  },
  packageOptions: {
    rollup: {
      plugins: [
        rollupPluginSvelte({
          include: ['~src/../node_modules/svelte-spa-router'],
          dev: process.env.NODE_ENV !== 'production',
        }),
      ],
    },
  },
  devOptions: {
    /* ... */
    // open: 'none', // chrome
  },
  buildOptions: {
    /* ... */
  },
  alias: {
    '~public': './public',
    '~components': './src/components',
    '~assets': './src/assets',
    '~src': './src',
    '~img': './src/assets/img',
    '~css': './src/assets/css',
    '~pages': './src/pages',
    '~layouts': './src/layouts',
    '~plugins': './src/plugins',
    '~router': './src/router',
  },
}
