// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // as duas pastas onde vivem seus JSX/TSX
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',

    // se eventualmente usar css/tsx em outro lugar
    // './src/styles/**/*.{css,js,ts,jsx,tsx}',
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
