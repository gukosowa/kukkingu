const autoPreprocess = require('svelte-preprocess')

module.exports = {
  preprocess: autoPreprocess({
    defaults: {
      script: 'typescript',
    },
    postcss: {
      plugins: [
        require('postcss-preset-env')({ stage: 1 }),
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  }),
}
