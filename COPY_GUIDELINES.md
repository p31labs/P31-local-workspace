# Copy Guidelines — Public-Facing Text

## Purpose
Ensure all public-facing copy is family-friendly, accurate, and free from
internal jargon, speculative claims, or contested framing.

## Banned Terms (Public-Facing Only)

| Banned Term | Approved Replacement | Rationale |
|-------------|---------------------|-----------|
| sovereign | independent / open / federated | Overly political; implies unaccountable authority |
| spoon-aware | cognitive-friendly / inclusive | Internal metaphor; not family-friendly |
| Spoon-Aware | cognitive-friendly / inclusive | Capitalized variant |
| Spoon‑Aware | cognitive-friendly / inclusive | Non-breaking hyphen variant |
| spoon aware | cognitive-friendly / inclusive | Spaced variant |
| quantum-ready | open-source / verified | Overstates crypto capabilities |
| post-quantum | open-source / verified | Overstates crypto capabilities |

## Allowed Exceptions

The following are **technical/infrastructure terms** and are **NOT** banned:

| Term | Context | Why Allowed |
|------|---------|-------------|
| quantum | File/module names (`quantum.css`, `@p31/ui/quantum`) | Technical module naming |
| data-theme="quantum" | Theme attribute | Design system token |
| quantum-cyan | CSS variable / color token | Design token |
| quantum-violet | CSS variable / color token | Design token |
| quantum-red | CSS variable / color token | Design token |
| quantum-green | CSS variable / color token | Design token |

## Scope

This rule applies to **public-facing copy** in:
- Astro page files (`apps/p31ca/src/pages/**/*.astro`)
- Astro layout files (`apps/p31ca/src/layouts/**/*.astro`)
- Any other user-visible text in deployed apps

It does **not** apply to:
- Internal documentation (`docs/`, `CLAUDE.md`, `AGENTS.md`)
- Source code comments and identifiers
- Module/file names
- CSS class names and design tokens
- Test files
- Private/internal routes

## Enforcement

- **CI guardrail:** `.github/workflows/copy-lint.yml` greps for banned terms on every PR.
- **Pre-deploy check:** Run `pnpm run lint:copy` before deploying.
- **Agent instruction:** All agents must read this file before editing public-facing copy.

## Adding New Terms

When a term is identified as problematic:
1. Add it to the Banned Terms table with an approved replacement.
2. Update `.github/workflows/copy-lint.yml` with the new pattern.
3. Audit all existing pages and replace occurrences.
4. Commit the cleanup + rule update together.
