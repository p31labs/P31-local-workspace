# P31 Design Governance Rules

These are **executable rules** that agents and CI can enforce. Each rule includes a check script.

## Rule 1: No Hardcoded Colors

**Constraint:** Colors MUST come from `@p31/design-core` tokens. No invented hex values.

**Check:**
```bash
grep -rn "color: #[0-9a-fA-F]\{6\}" --include="*.css" --include="*.tsx" apps/ | grep -v "var(--"
```

**Agent prompt:** Replace hardcoded colors with the nearest token from the P31 palette.

## Rule 2: No Hardcoded Spacing

**Constraint:** Spacing MUST use the P31 spacing scale. No arbitrary pixel values.

**Check:**
```bash
grep -rn "padding:[^;]*px" --include="*.css" apps/ | grep -v "var(--p31-space\|--p31-spacing"
grep -rn "margin:[^;]*px" --include="*.css" apps/ | grep -v "var(--p31-space\|--p31-spacing"
```

**Agent prompt:** Replace hardcoded spacing with the nearest token from the spacing scale.

## Rule 3: No Hardcoded Radius

**Constraint:** Radius MUST use `--p31-radius-*` tokens.

**Check:**
```bash
grep -rn "border-radius:[^;]*px" --include="*.css" apps/ | grep -v "var(--p31-radius"
```

**Agent prompt:** Replace hardcoded radius with the nearest token from the radii scale.

## Rule 4: Spoon-Aware Motion

**Constraint:** Every component must declare `data-spoons` and respond to spoon-state changes.

**Check:**
```bash
grep -rnL "data-spoons" --include="*.tsx" apps/ | while read f; do echo "MISSING spoon check: $f"; done
```

**Agent prompt:** Every component must check `data-spoons` before applying motion. At spoons ≤ 1, disable all motion.

## Rule 5: Single Accent

**Constraint:** Maximum 1 `quantum-cyan` primary accent element per screen.

**Check:**
```bash
# Count quantum-cyan color declarations per file
grep -rn "quantum-cyan\|#00F0FF" --include="*.css" --include="*.tsx" apps/
```

**Agent prompt:** Use `quantum-cyan` for exactly one primary action per screen. Secondary actions get `quantum-violet`.

## Rule 6: No Pure White Text

**Constraint:** Never use pure white (`#FFFFFF`) for text.

**Check:**
```bash
grep -rn "color: #FFFFFF\|color: #fff\|color: white" --include="*.css" --include="*.tsx" apps/
```

**Agent prompt:** Use `text-primary` (`#F5F5F7`) instead of pure white.

## Rule 7: No Pure Black Backgrounds

**Constraint:** Never use pure black (`#000000`) for backgrounds.

**Check:**
```bash
grep -rn "background: #000000\|background: #000\|background: black" --include="*.css" --include="*.tsx" apps/
```

**Agent prompt:** Use `void` (`#0A0A0F`) instead of pure black.

## Rule 8: Glass Cards Only

**Constraint:** All containers should use `glass-card` or `glass-panel` CSS classes or tokens. No flat background containers.

**Check:**
```bash
# Find containers with background-color but no glass class
grep -rn "className.*bg-" --include="*.tsx" apps/ | grep -v "glass\|GlowButton\|Button"
```

**Agent prompt:** Use `glass-card` for content containers. Never use flat background colors on containers.

## Rule 9: Touch Targets ≥ 48px

**Constraint:** All interactive elements must have minimum touch target of 48px.

**Check:**
```bash
grep -rn "min-height\|min-width\|height.*[0-9]\{2\}px\|width.*[0-9]\{2\}px" --include="*.css" apps/ | grep -v "48px\|64px\|56px"
```

**Agent prompt:** All buttons, links, and interactive elements must have `min-height: 48px`.

## Rule 10: prefers-reduced-motion Fallback

**Constraint:** All motion rules must have a `prefers-reduced-motion` fallback.

**Check:**
```bash
for f in $(grep -rln "transition\|animation" --include="*.css" apps/); do
  if ! grep -q "prefers-reduced-motion" "$f"; then
    echo "MISSING reduced-motion fallback: $f"
  fi
done
```

**Agent prompt:** Always include a `prefers-reduced-motion` fallback for every CSS motion rule.

---

## CI Integration

```yaml
# .github/workflows/design-lint.yml
name: Design Lint
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - name: Check hardcoded colors
        run: |
          violations=$(grep -rn "color: #[0-9a-fA-F]\{6\}" --include="*.css" --include="*.tsx" apps/ | grep -v "var(--" || true)
          if [ -n "$violations" ]; then echo "$violations"; exit 1; fi
      - name: Check pure white text
        run: |
          violations=$(grep -rn "color: #FFFFFF\|color: #fff\|color: white" --include="*.css" --include="*.tsx" apps/ || true)
          if [ -n "$violations" ]; then echo "$violations"; exit 1; fi
      - name: Check pure black backgrounds
        run: |
          violations=$(grep -rn "background: #000000\|background: #000\|background: black" --include="*.css" --include="*.tsx" apps/ || true)
          if [ -n "$violations" ]; then echo "$violations"; exit 1; fi
      - name: Check spoon-aware motion
        run: |
          violations=$(grep -rnL "data-spoons" --include="*.tsx" apps/ | head -5 || true)
          if [ -n "$violations" ]; then echo "Missing data-spoons: $violations"; exit 1; fi
```

## Exceptions

To allow an exception, add:
- `// p31-ignore: rule-name` comment in the source
- The exception must be reviewed and approved by a design system maintainer
- Exceptions are logged and reviewed quarterly
