/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        ink: '#1e293b',
        primary: '#2563eb',
        action: '#16a34a'
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.10)',
        panel: '0 24px 80px rgba(15, 23, 42, 0.16)'
      }
    }
  },
  plugins: []
};
