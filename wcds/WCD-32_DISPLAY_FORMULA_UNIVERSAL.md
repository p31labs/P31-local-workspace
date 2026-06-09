# WCD-32: displayFormula() UNIVERSAL ENFORCEMENT

**Status:** 🟡 HIGH — raw Hill notation still appearing in formula bar
**Date:** March 3, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Before March 10 ship. Recurring visual bug.
**QA Source:** Will Johnson — `CHNNaMnFe` (Image 1), `CHNOPSNaCaMnClFe` (earlier batch), `NaClo` (earlier)

---

## 1. DEFECT DESCRIPTION

Despite WCD-14 creating a `displayFormula()` utility for conventional notation with Unicode subscripts, raw Hill system formulas continue to appear in the UI. This has been observed across multiple QA passes:

- `CHNNaMnFe` at 71% (Chromebook, Image 1)
- `CHNOPSNaCaMnClFe` at 83% (earlier Pixel screenshots)
- `NaClo` (lowercase 'o' — earlier batch)

**Root Cause:** The `displayFormula()` function exists but is NOT called in every code path that renders a formula. There are multiple places in the codebase that display formula strings:

1. Formula/stability bar (StabilityMeter.tsx or FormulaBar)
2. Completion modal (CompletionModal.tsx)
3. Achievement toasts
4. Quest HUD (current target formula)
5. "NEW DISCOVERY" modal
6. Exhibit A / download text
7. Molecule counter tooltip (if any)
8. Multiplayer relay state broadcast

Some of these paths call `displayFormula()`. Others display the raw Hill key directly.

---

## 2. FIX: SINGLE SOURCE OF TRUTH

### Strategy: Never expose raw Hill to any UI component

#### Step 1: Audit every place a formula string reaches the DOM

Search the codebase for:
- `formula` appearing in JSX/TSX (any `{formula}` or `{currentFormula}` in a render)
- `getFormula()` or `calculateFormula()` calls that feed into UI
- Any `.formula` property access in components

Every single one must go through `displayFormula()`.

#### Step 2: Create a `<Formula>` component

Instead of trusting every developer/AI to remember to call `displayFormula()`, create a React component that encapsulates it:

```typescript
// src/components/Formula.tsx
import { displayFormula } from '../chemistry/displayFormula';

interface FormulaProps {
  hill: string;           // raw Hill system key (internal)
  className?: string;
}

export function Formula({ hill, className }: FormulaProps) {
  const display = displayFormula(hill);
  return <span className={className}>{display}</span>;
}
```

Usage everywhere:

```typescript
// WRONG (raw Hill leaks to UI)
<span>{currentFormula}</span>

// RIGHT (always formatted)
<Formula hill={currentFormula} />
```

#### Step 3: Make displayFormula() handle ALL cases

The function must handle:

```typescript
export function displayFormula(hillFormula: string): string {
  if (!hillFormula) return '';
  
  // 1. Check DISPLAY_OVERRIDES for known conventional orderings
  //    e.g., 'ClNa' → 'NaCl', 'ClH' → 'HCl', 'OCa' → 'CaO'
  const override = DISPLAY_OVERRIDES[hillFormula];
  const ordered = override || hillFormula;
  
  // 2. Add Unicode subscripts to numbers
  //    H2O → H₂O, C6H12O6 → C₆H₁₂O₆
  return ordered.replace(/(\d+)/g, (match) => {
    return match.split('').map(d => SUBSCRIPT_MAP[d]).join('');
  });
}

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};
```

**Critical:** The function must work for ALL formulas, not just ones in the molecule dictionary. When a player creates `CHNNaMnFe` (not a real molecule), it should still display as `CHNNaMnFe` with proper formatting — or ideally as `CHFeNNaMn` (Hill convention: C first, H second, then alphabetical) with subscripts where counts > 1.

For uncatalogued molecules, Hill IS the conventional display. The problem is that the raw string already follows Hill ordering. So `displayFormula()` just needs to add subscripts and ensure element symbols are properly capitalized.

#### Step 4: Fix the specific cases

```typescript
const DISPLAY_OVERRIDES: Record<string, string> = {
  // Ensure ALL known molecules have conventional notation
  'ClH':    'HCl',
  'ClNa':   'NaCl',
  'OCa':    'CaO',
  'ONaCl':  'NaClO',
  'O2Ca':   'CaO₂',    // if this comes up
  // ... complete the override map for all 62 molecules
};
```

---

## 3. FILE MANIFEST

Files you WILL create:

| File | Purpose |
|------|---------|
| `src/components/Formula.tsx` | Reusable `<Formula>` component wrapping displayFormula() |

Files you WILL modify:

| File | Action |
|------|--------|
| `src/chemistry/displayFormula.ts` | Ensure handles ALL formula strings, not just dictionary entries |
| `src/components/StabilityMeter.tsx` / FormulaBar | Replace raw formula strings with `<Formula>` component |
| `src/components/CompletionModal.tsx` | Replace raw formula with `<Formula>` |
| `src/components/QuestHUD.tsx` | Replace raw formula with `<Formula>` |
| `src/components/DiscoveryModal.tsx` (NEW DISCOVERY screen) | Replace raw formula with `<Formula>` |
| Any other component displaying a formula string | Replace with `<Formula>` |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/molecules.ts` | Internal keys stay as Hill (the engine uses them) |
| `src/stores/gameStore.ts` | Store keeps raw Hill keys (internal representation) |
| `src/telemetry/*` | Telemetry logs raw Hill (machine-readable, not human-facing) |

---

## 4. VERIFICATION CHECKLIST

- [ ] **H₂ (Seed):** Displays as "H₂" with subscript, never "H2"
- [ ] **H₂O (Seed):** Displays as "H₂O", never "H2O"
- [ ] **NaCl (Sapling):** Displays as "NaCl", never "ClNa"
- [ ] **CaO (Sapling):** Displays as "CaO", never "OCa"
- [ ] **HCl (Sapling):** Displays as "HCl", never "ClH"
- [ ] **C₆H₁₂O₆ (Sprout):** Displays as "C₆H₁₂O₆", never "C6H12O6"
- [ ] **Uncatalogued formula (any random combination):** Displays with subscripts, properly capitalized
- [ ] **CHNNaMnFe (the actual test case):** Displays with proper element boundaries and any subscripts
- [ ] **Formula bar:** Uses `<Formula>` component
- [ ] **Completion modal:** Uses `<Formula>` component
- [ ] **Quest HUD (target molecule):** Uses `<Formula>` component
- [ ] **NEW DISCOVERY modal:** Uses `<Formula>` component
- [ ] **Achievement toasts:** Uses `<Formula>` component where formula appears
- [ ] **NO raw Hill strings** appear anywhere in the rendered UI
- [ ] **Vitest:** All existing tests pass + new test for displayFormula edge cases
- [ ] **Build clean:** `npm run build` — zero errors

---

## 5. HOW TO VERIFY: THE GREP TEST

After implementation, run:

```bash
# Find any place a formula variable is rendered in JSX without <Formula>
grep -rn 'currentFormula\|\.formula\b' src/components/ | grep -v 'Formula' | grep -v 'import'
```

Every result should either be:
- Inside a `<Formula hill={...} />` usage
- A non-display usage (storing, comparing, passing as prop to `<Formula>`)

If any result shows `{currentFormula}` or `{formula}` directly in JSX, it's a leak.

---

*WCD-32 — Opus — March 3, 2026*
*"The player never sees Hill notation. The player sees chemistry."*
