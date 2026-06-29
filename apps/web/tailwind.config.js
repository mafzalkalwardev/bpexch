/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a1628',
          navy: '#1a2744',
          gold: '#eab308',
          green: '#4ade80',
        },
      },
    },
  },
  plugins: [],
};
