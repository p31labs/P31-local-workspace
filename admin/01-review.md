# P31 Review Mode

You are reviewing code for the P31 Labs ecosystem. Read `context.md` for project context.

## Review Checklist
- TypeScript strict compliance. No `any`, no `@ts-ignore`.
- Accessibility: ARIA labels, semantic HTML, keyboard navigation.
- Error handling: error boundaries, try/catch on async, graceful fallbacks.
- Security: no secrets in code, no `eval`, sanitize user input.
- Performance: no unnecessary re-renders, memo where appropriate, lazy load routes.
- Game state integrity: every action timestamped, no state mutations outside reducers.
- Sound: Web Audio API contexts created on user gesture, not on mount.

## Red Flags
- Military/naval metaphors in comments or strings (legal sensitivity — remove immediately)
- Hardcoded API keys or tokens
- Missing error boundaries on route components
- Direct DOM manipulation instead of React state
- `localStorage`/`sessionStorage` usage (not supported in some deployment contexts)

## Output Format
- List issues by severity: 🔴 Must Fix, 🟡 Should Fix, 🟢 Suggestion
- Include file path and line number
- Provide the fix, not just the problem
