module.exports = {
  future: {
    purgeLayersByDefault: true,
  },
  purge: {
    content: ['./src/**/*.svelte'],
    options: {
      whitelistPatterns: [/^bg-pink-/, /^bg-green-/, /^bg-red-/, /^bg-gray-/],
    },
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
