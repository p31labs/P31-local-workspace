# WCD-15: FORMULA BAR CLIPPING — GENESIS BADGE OVERLAP

**Status:** 🔴 SHIP BLOCKER — visible to every tester on every molecule
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** Before Facebook soft launch (March 3)
**QA Source:** Will Johnson, iPhone, bonding.p31ca.org — 9 screenshots

---

## 1. DEFECT DESCRIPTION

The Genesis badge ("Genesis 0/4" with 🔥 icon) and the formula progress bar occupy the same horizontal row in the command bar area. When a formula is active, the badge overlaps the left edge of the formula text, causing left-truncation.

**Observed:** `aCa₂Cl` at 92% (should be `NaCa₂Cl` or full formula)
**Expected:** Full formula visible with no truncation

This appears in multiple screenshots across Sapling mode, confirming it's consistent and not a one-off rendering glitch.

**Root Cause (Probable):** The Genesis badge and formula bar are positioned in the same row with absolute or overlapping positioning. The badge has a fixed width, and the formula text starts underneath it rather than after it. Or the container has `overflow: hidden` clipping the formula from the left.

---

## 2. FIX OPTIONS

### Option A: Collapse Genesis badge when formula active (RECOMMENDED)

When a molecule is being built (formula progress bar is visible), collapse the Genesis badge to icon-only:

```
No molecule active:    [🔥 Genesis 0/4]
Molecule active:       [🔥] [NaCa₂Cl ████████░░ 92%]
```

The badge shrinks to just the fire icon (~40px), giving the formula bar the remaining width. Tap the icon to expand if needed.

### Option B: Stack vertically

Put Genesis badge on its own row above the formula bar:

```
[🔥 Genesis 0/4                    ]
[NaCa₂Cl ████████████░░░░░░ 92%   ]
```

This costs vertical space but eliminates all overlap. Less ideal on mobile where vertical space is premium.

### Option C: Truncate from the RIGHT, not the left

If the formula must share space, truncate the end of long formulas with ellipsis, not the beginning. `NaCa₂C…` is better than `aCa₂Cl` because the leading elements tell you what you're building.

**Recommendation: Option A.** The Genesis badge is informational (0/4 quest progress); the formula bar is actionable (what you're building right now). During active building, the formula takes priority.

---

## 3. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/CommandBar.tsx` (or equivalent bar component) | Fix layout: badge + formula sharing horizontal space |
| `src/components/GenesisBadge.tsx` (if separate component) | Add collapsed state when formula is active |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/telemetry/*` | Genesis Block data is correct; this is a display issue |
| `src/chemistry/*` | Formula generation is correct; this is a layout issue |
| `worker-telemetry.ts` | Worker is unrelated |

---

## 4. WIRING GUIDE

### Step 1: Identify the container

Find the component that renders both the Genesis badge and the formula progress bar. It's likely a flex row or grid in the command/status bar area below the top HUD.

### Step 2: Conditional badge width

```typescript
const isFormulaActive = currentFormula !== null && currentFormula !== '';

// Genesis badge
<div className={`genesis-badge ${isFormulaActive ? 'collapsed' : 'expanded'}`}>
  <span className="genesis-icon">🔥</span>
  {!isFormulaActive && <span className="genesis-text">Genesis {questProgress}</span>}
</div>

// Formula bar takes remaining space
{isFormulaActive && (
  <div className="formula-bar" style={{ flex: 1, minWidth: 0 }}>
    <span className="formula-text">{displayFormula(currentFormula)}</span>
    <div className="progress-track">...</div>
    <span className="progress-pct">{stability}%</span>
  </div>
)}
```

### Step 3: Ensure `minWidth: 0` on flex children

This is the most common cause of flex-child overflow. Without `minWidth: 0`, a flex child won't shrink below its content width, causing overlap:

```css
.formula-bar {
  flex: 1;
  min-width: 0;           /* allows shrinking below content size */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Step 4: Ensure text truncation goes RIGHT, not LEFT

```css
.formula-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: ltr;          /* ensure left-to-right truncation */
}
```

---

## 5. VERIFICATION CHECKLIST

- [ ] **Short formula (H₂O):** Fully visible, no truncation, Genesis badge visible
- [ ] **Medium formula (NaCl):** Fully visible alongside Genesis badge
- [ ] **Long formula (NaCa₂Cl or longer):** Visible from the LEFT; if truncated, truncation is on the RIGHT with ellipsis
- [ ] **No formula active:** Genesis badge shows full text "Genesis 0/4"
- [ ] **Formula active:** Genesis badge collapses to icon-only (Option A) or formula is fully visible (Option B/C)
- [ ] **Mobile (iPhone/Android):** No overlap at any screen width
- [ ] **Desktop:** No regression on wider screens
- [ ] **Vitest:** All existing tests pass
- [ ] **Build clean:** `npm run build` — zero errors

---

*WCD-15 — Opus — March 2, 2026*
*"If the player can't read the formula, they don't know what they're building."*
