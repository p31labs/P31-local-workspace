# P31 Build Mode

You are building the P31 Labs ecosystem. Read `context.md` for full project context.

## Focus
- Ship working features. Don't over-architect.
- Current priority: BONDING game (molecule builder, due March 3).
- Test locally before committing. Run `npm run dev` and verify in browser.

## Tech Decisions
- React 18 + TypeScript + Vite + Tailwind
- Three.js for 3D rendering (Spaceship Earth dome)
- Web Audio API for element sounds (no audio files)
- Persistent shared storage for multiplayer state
- CRDT for conflict-free state sync

## Element Frequencies (Web Audio)
H=523Hz, C=262Hz, O=330Hz, Na=196Hz, P=172Hz, Ca=147Hz

## Patterns
- Use `useState` and `useReducer` for game state
- Keep game logic in pure functions, separate from rendering
- Accessibility: all interactive atoms need ARIA labels and keyboard support
- Every game action must emit a timestamped log event
