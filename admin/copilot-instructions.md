# P31 Labs — Copilot Instructions

## Project
Open-source assistive technology for neurodivergent users. React + TypeScript + Vite + Tailwind + Three.js frontend. FastAPI + PostgreSQL backend.

## Stack Rules
- TypeScript strict. No `any`.
- React functional components + hooks only.
- Tailwind CSS — no CSS modules.
- ESLint v10 flat config at `pwa/eslint.config.js`.
- Vitest for unit tests. Playwright for E2E.
- Named exports. One component per file. PascalCase for components.

## Repo Layout
- `pwa/` — Buffer app, BondingView
- `apps/web/` — Spaceship Earth dashboard, IVM, wallet, onboarding
- `context.md` — Full project context (read this for any non-trivial task)

## Current Priority
BONDING game — molecule builder with real valence chemistry. Due March 3, 2026.

## Style
- Direct communication. No filler.
- Never use military or naval metaphors.
- Accessibility-first: ARIA labels, semantic HTML, keyboard navigation.

## Constants
- Larmor: 863 Hz
- Element frequencies: H=523, C=262, O=330, Na=196, P=172, Ca=147 (Hz)
