/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        phos: {
          bg: '#09090b',
          surface: '#18181b',
          border: '#27272a',
          accent: '#39ff14',
          cyan: '#00f5ff',
          orchid: '#da70d6',
          amber: '#feca57',
        },
        quantum: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          pink: '#ec4899',
          violet: '#8b5cf6',
        },
        willow: {
          pink: '#fbcfe8',
          lavender: '#e9d5ff',
          mint: '#d1fae5',
          peach: '#fed7aa',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.5)',
        'glow-pink': '0 0 15px rgba(236, 72, 153, 0.5)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        breath: 'breath 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 5px currentColor)' },
          '50%': { filter: 'brightness(1.2) drop-shadow(0 0 20px currentColor)' },
        },
        breath: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
};
