const path = require('path')

module.exports = {
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.json', '.svelte'],
    alias: {
      '~public': path.resolve(__dirname, './public'),
      '~src': path.resolve(__dirname, './src'),
      '~components': path.resolve(__dirname, './src/components'),
      '~assets': path.resolve(__dirname, './src/assets'),
      '~img': path.resolve(__dirname, './src/assets/img'),
      '~css': path.resolve(__dirname, './src/assets/css'),
      '~pages': path.resolve(__dirname, './src/pages'),
      '~layouts': path.resolve(__dirname, './src/layouts'),
      '~plugins': path.resolve(__dirname, './src/plugins'),
      '~router': path.resolve(__dirname, './src/router'),
    },
  },
}
