/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm Tech Humanity Palette
        cloud: '#F0EEE9',           // Warm Cloud - backgrounds
        espresso: '#264653',        // Espresso Teal - text, footers
        'teal-600': '#2A9D8F',      // Transformative Teal - primary brand
        'coral-500': '#E76F51',     // Soft Coral - CTAs
        butter: '#E9C46A',          // Butter Yellow - accents
        lavender: '#C9B1FF',        // Soft Lavender - neuro-links
      },
      fontFamily: {
        heading: ['Lato', 'sans-serif'],
        body: ['Lexend', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        morph: 'morph 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' },
          '34%': { borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%' },
          '67%': { borderRadius: '100% 60% 60% 100% / 100% 100% 60% 60%' },
        },
      },
    },
  },
  plugins: [],
}