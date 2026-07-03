/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        heading: ['var(--phos-font-heading)', 'monospace'],
        body: ['var(--phos-font-body)', 'sans-serif'],
      },
      colors: {
        phos: {
          bg: 'var(--p31-bg)',
          text: 'var(--p31-text)',
          mute: 'var(--p31-text-muted)',
          accent: 'var(--p31-accent-secondary)',
          primary: 'var(--p31-accent-primary)',
          border: 'var(--p31-surface-border)',
          card: 'var(--p31-surface)',
        },
        p31: {
          bg: 'var(--p31-bg)',
          text: 'var(--p31-text)',
          accent: 'var(--p31-accent-primary)',
          border: 'var(--p31-surface-border)',
          surface: 'var(--p31-surface)',
        },
      },
      spacing: {
        'phos-1': 'var(--phos-space-1)',
        'phos-2': 'var(--phos-space-2)',
        'phos-3': 'var(--phos-space-3)',
        'phos-4': 'var(--phos-space-4)',
        'phos-6': 'var(--phos-space-6)',
        'phos-8': 'var(--phos-space-8)',
      },
      transitionDuration: {
        phos: 'var(--phos-motion-duration)',
      },
      transitionTimingFunction: {
        phos: 'var(--phos-motion-ease)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
