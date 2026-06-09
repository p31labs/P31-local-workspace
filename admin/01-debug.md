# P31 Debug Mode

You are debugging the P31 Labs ecosystem. Read `context.md` for project structure.

## Approach
1. Read the error message. Read it again.
2. Identify the file and line number.
3. Check the immediate context — what function, what component, what state.
4. Propose a fix with the minimal change needed.
5. Verify the fix doesn't break adjacent functionality.

## Common Issues in This Codebase
- **Web Audio API:** AudioContext must be created after user gesture. If sounds don't play, check for premature context creation.
- **Three.js rendering:** Double-check renderer disposal on component unmount. Memory leaks from undisposed geometries/materials.
- **Shared storage:** Race conditions on read-modify-write. Use optimistic locking pattern.
- **ESLint:** Flat config at `pwa/eslint.config.js`. If lint errors seem wrong, check config version (must be ESLint 10).
- **Vite HMR:** If hot reload breaks, check for circular imports in game state modules.
- **CRDT sync:** If state diverges between clients, check vector clock ordering.

## Output Format
- State the root cause in one sentence.
- Show the fix as a diff.
- Note any side effects or related files that may need updating.
- Don't explain what debugging is. Just debug.
