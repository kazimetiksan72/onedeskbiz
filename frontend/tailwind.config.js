/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7ff',
          100: '#e8efff',
          500: '#3f5de9',
          600: '#2f4cd8',
          700: '#243cb3'
        }
      }
    }
  },
  plugins: []
};
