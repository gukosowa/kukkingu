module.exports = {
  future: {
    purgeLayersByDefault: true,
  },
  purge: {
    content: ['./src/**/*.svelte'],
    whitelistPatterns: [/bg-pink-/, /bg-green-/, /bg-red-/, /bg-gray-/],
  },
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff3e00',
        },
      },
    },
  },
  variants: {},
  plugins: [],
}
