/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0f',
          card: '#12121a',
          hover: '#1a1a2e',
          active: '#1e1e38',
          border: '#1e293b',
        },
        security: {
          emerald: '#10b981',
          teal: '#14b8a6',
          darkTeal: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};
