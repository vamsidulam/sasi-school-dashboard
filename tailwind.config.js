/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DA3438',
          600: '#C2272B',
          700: '#A21D20',
          800: '#7F1A1C',
          900: '#5F1416',
        },
      },
    },
  },
  plugins: [],
}
