# P31 Labs — Agent Instructions

## Project Overview
P31 Labs builds open-source assistive technology for neurodivergent individuals. This is a Georgia 501(c)(3) nonprofit. Full context is in `context.md` at the project root.

## Architecture
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Three.js
- **Backend:** FastAPI + PostgreSQL + Redis
- **State:** CRDT sync over WebSocket
- **Repo:** `pwa/` (Buffer, BondingView), `apps/web/` (Spaceship Earth, IVM, wallet)

## Coding Conventions

### TypeScript
- Strict mode enabled. No `any`.
- Prefer `interface` over `type` for object shapes.
- Use discriminated unions for state machines.
- Named exports. One component per file.

### React
- Functional components only. Hooks for state and effects.
- Error boundaries wrapping every route/view.
- Tailwind for styling — no CSS modules, no styled-components.
- All interactive elements need ARIA labels and keyboard handlers.

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Tests: `*.test.ts` or `*.test.tsx` colocated with source

### ESLint
- v10 flat config at `pwa/eslint.config.js`
- Run `npx eslint .` before committing

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Branch naming: `feat/bonding-game`, `fix/audio-context`, `docs/context-update`

## Current Sprint Priority
🔴 **BONDING Game — Due March 3, 2026**
Molecule builder with real chemistry. See `context.md` Section 4 for full spec.

## Communication Style
- Be direct. Skip preamble.
- Output code and commands, not explanations of what you're about to do.
- Never use submarine, naval, or military metaphors. The project founder was a DoD civilian engineer (not military) and this is a legal sensitivity.
- If asked about the project's metaphorical framework (Delta/Wye topology, Posner molecules, decoherence), these are architectural concepts — not decoration. Treat them as first-class design vocabulary.

## Key Domain Terms
- **Delta topology:** Mesh network (resilient, target architecture)
- **Wye topology:** Star network (fragile, legacy pattern)
- **L.O.V.E.:** Ledger of Ontological Volume and Entropy (token economy)
- **Spoons:** Cognitive energy units (disability framework)
- **Larmor frequency:** 863 Hz (³¹P in Earth's field, system constant)
- **SOULSAFE:** Safety-critical QA principles from nuclear industry applied to cognitive systems
