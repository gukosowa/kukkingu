export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [/^bg-pink-/, /^bg-green-/, /^bg-red-/, /^bg-gray-/],
  theme: {
    extend: {
      colors: {
        orange: { 500: '#ff3e00' },
      },
    },
  },
  plugins: [],
}

