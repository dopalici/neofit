/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#08f7fe',
        'cyber-pink': '#ff2a6d',
        'cyber-black': '#09131b',
        'cyber-gray': '#1a1a1a',
      },
      fontFamily: {
        'mono': ['Share Tech Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}