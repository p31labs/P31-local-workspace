/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Quantum Dark Palette
        void: '#030305',
        surface: '#0a0a14',
        surface2: '#111122',
        quantum: {
          cyan: '#00f0ff',
          violet: '#b53cff',
          gold: '#ffd700',
          green: '#00ff66',
          red: '#ff003c',
        },
        cloud: '#8b9bb4',
        ink: '#ffffff',
        muted: '#4a5b78',
      },
      fontFamily: {
        heading: ['JetBrains Mono', 'monospace'],
        body: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out',
        'morph': 'morph 8s ease-in-out infinite',
        'rotate-core': 'rotateCore 10s linear infinite',
        'breathe-core': 'breatheCore 4s ease-in-out infinite',
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
        rotateCore: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.05)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        breatheCore: {
          '0%': { opacity: '0.2', transform: 'scale(0.9)' },
          '100%': { opacity: '0.6', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}