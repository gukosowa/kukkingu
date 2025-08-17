import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./src/**/*.{html,js,ts,vue}'],
  // Ensure dynamic bg-* classes are included in the build
  safelist: [
    { pattern: /^bg-pink-/ },
    { pattern: /^bg-green-/ },
    { pattern: /^bg-red-/ },
    { pattern: /^bg-gray-/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        // Prefer Inter for Latin; fall back to Noto Sans JP for Japanese
        sans: ['Inter', '"Noto Sans JP"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        orange: { 500: '#ff3e00' },
      },
    },
  },
  plugins: [],
}
