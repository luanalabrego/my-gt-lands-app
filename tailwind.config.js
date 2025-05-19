// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        black:      '#000000',
        'gray-dark':'#1F1F1F',
        gold:       '#D4AF37',
      },
    },
  },
  plugins: [],
}
