/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        willow: {
          pink: '#FF6B9D',
          blue: '#4A90E2',
          amber: '#FFC107',
          mint: '#FFF1F5',
        },
      },
    },
  },
  plugins: [],
};
