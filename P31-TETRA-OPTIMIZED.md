# P31-TETRA: OPTIMIZED
## Four Entry Points → One System. Deploy Today.

**Status:** Ready to execute  
**Time to deployment:** 35 minutes (per phase)  
**Phases:** 4 (parallel deployment)

---

## 🎯 THE TETRA (4 Entry Points, 1 Design System)

```
phosphorus31.org (Nonprofit Portal)
     ↓ ← same tokens
p31ca.org (Technical Hub)
     ↓ ← same tokens
PHOS (Workspace)
     ↓ ← same tokens
WILLOW (Kids)
```

---

## 📦 WHAT CHANGES

| Platform | Before | After | Impact |
|----------|--------|-------|--------|
| Header height | 56px, 48px, custom, wrong | 48px (locked) | ✅ Perfect |
| Colors | #39FF14, #00F0FF, cyan-ish, diff | oklch(65% 0.18 195) | ✅ Identical |
| Spacing | 24px, 16px, loose, excessive | var(--p31-space-*) | ✅ Unified |
| Typography | Random sizes | var(--p31-type-*) | ✅ Hierarchy |

**Result:** One ecosystem. Not four products.

---

## ⚡ DEPLOY PLAN (35 min per platform)

### Phase 1: p31ca.org (Developer-friendly. Go first.)

**Step 1: Copy tokens (2 min)**
```bash
cp schemas/tokens.v2.yml schemas/tokens.v2.yml
cp src/styles/quantum-design-system.css src/styles/quantum-design-system.css
```

**Step 2: Update imports (5 min)**
```typescript
// src/pages/index.tsx
import { Header } from '@p31/templates/Header'
import { Crown } from '@p31/components/Crown'
import '@p31/styles/quantum-design-system.css'

// Replace Header component
<Header 
  navLinks={[
    { label: 'Docs', href: '/docs' },
    { label: 'For Families', href: 'https://phosphorus31.org' },
    { label: 'Try PHOS', href: 'https://phos.p31.io' },
    { label: 'For Kids', href: 'https://willow.p31.io' },
  ]}
/>
```

**Step 3: Validate (3 min)**
```bash
p31 lint:spacing
p31 lint:tokens
p31 validate:all
# All should pass ✅
```

**Step 4: Deploy (25 min)**
```bash
npm run build
npm run deploy
# Wait for CI/CD
```

### Phase 2: phosphorus31.org (Family-focused. Run in parallel.)

**Same 4 steps as Phase 1, with:**
```typescript
// Update nav to showcase ecosystem
navLinks={[
  { label: 'What We Do', href: '#mission' },
  { label: 'Developer Hub', href: 'https://p31ca.org' },
  { label: 'Try PHOS', href: 'https://phos.p31.io' },
  { label: 'For Kids', href: 'https://willow.p31.io' },
]}
```

### Phase 3: PHOS (Workspace. Parallel.)

**Minimal changes (uses PWA framework):**
```typescript
// src/components/PHOSWorkspace.tsx
import '@p31/styles/quantum-design-system.css'
import { Crown } from '@p31/components/Crown'

<header style={{ height: 'var(--p31-header-h)' }}>
  <Crown size="lg" />
</header>

<div style={{
  background: 'var(--p31-surface-bg)',
  color: 'var(--p31-text-primary)',
  gap: 'var(--p31-space-lg)',
}}>
  {/* Existing content, now token-styled */}
</div>
```

### Phase 4: WILLOW (Kids. Parallel.)

**Large text, generous touch targets:**
```typescript
// src/components/WILLOWHome.tsx
import '@p31/styles/quantum-design-system.css'

<button style={{
  fontSize: 'var(--p31-type-h2)',  // Bigger for kids
  padding: 'var(--p31-space-lg)',  // Generous spacing
  gap: 'var(--p31-space-md)',
}}>
  <Crown size="md" />
  Play BONDING
</button>
```

---

## ✅ VALIDATION CHECKLIST (5 min per platform)

After deployment:

```bash
# Run on deployed site (browser DevTools console)

// Check 1: Header height
console.log(getComputedStyle(document.querySelector('.header-container')).height)
// Expected: "48px"

// Check 2: Crown size
const crown = document.querySelector('.crown-svg')
console.log(crown.getBoundingClientRect().width, crown.getBoundingClientRect().height)
// Expected: ~40px × 40px (or scaled proportionally)

// Check 3: Color is OKLCH
const cyan = getComputedStyle(document.querySelector('[data-color="cyan"]')).color
console.log(cyan)
// Expected: color(display-p3 ...) or oklch(...)

// Check 4: Spacing uses tokens
const spacing = getComputedStyle(document.querySelector('.component-wrapper')).gap
console.log(spacing)
// Expected: "clamp(...)" or computed pixel value

// Check 5: Typography is fluid
const textSize = getComputedStyle(document.querySelector('h1')).fontSize
console.log(textSize)
// Expected: responsive size based on viewport

// Check 6: Cross-links work
const links = Array.from(document.querySelectorAll('a[href*="p31"]'))
console.log('Cross-links:', links.length)
// Expected: ≥4 (to other platforms)
```

---

## 📊 METRICS (Track Alignment)

**Real-time dashboard (after deployment):**

```typescript
// Monitor header consistency
const checkHeaderHeight = async () => {
  const sites = [
    'https://p31ca.org',
    'https://phosphorus31.org',
    'https://phos.p31.io',
    'https://willow.p31.io'
  ]
  
  for (const site of sites) {
    const header = await fetch(`${site}/.well-known/p31-metrics.json`)
    const { headerHeight, crownSize, primaryColor } = await header.json()
    
    console.log(`${site}:`, {
      headerHeight,    // Expected: 48px
      crownSize,       // Expected: 40px
      primaryColor,    // Expected: oklch(65% 0.18 195)
    })
  }
}

checkHeaderHeight()
```

**Lighthouse scores (must be 90+):**
```bash
p31 lighthouse:all
# Runs Lighthouse on all four platforms
# Reports: performance, accessibility, best-practices, seo
```

**User journey tracking:**
```typescript
// Log when user navigates between platforms
analytics.logEvent('cross_platform_navigation', {
  from: 'phosphorus31.org',
  to: 'p31ca.org',
  platform: 'tetra',
})
```

---

## 🔗 CROSS-LINKING (Wiring The Four)

**phosphorus31.org → navigation**
```astro
<nav class="tetra-nav">
  <a href="https://p31ca.org">Dev Hub</a>
  <a href="https://phos.p31.io">Workspace</a>
  <a href="https://willow.p31.io">For Kids</a>
</nav>
```

**p31ca.org → navigation**
```typescript
<nav class="tetra-nav">
  <a href="https://phosphorus31.org">About P31</a>
  <a href="https://phos.p31.io">Try PHOS</a>
  <a href="https://willow.p31.io">BONDING</a>
</nav>
```

**PHOS → footer**
```typescript
<footer className="tetra-footer">
  <a href="https://phosphorus31.org" title="About">ⓘ</a>
  <a href="https://p31ca.org" title="Docs">&lt;/&gt;</a>
  <a href="https://willow.p31.io" title="Kids">♥</a>
</footer>
```

**WILLOW → family hub**
```typescript
<div className="family-hub">
  <p>Dad is in PHOS</p>
  <a href="https://phos.p31.io">Say hi</a>
</div>
```

---

## 🚀 DEPLOY SCRIPT (Automate It)

```bash
#!/bin/bash
# deploy-tetra.sh

echo "P31-TETRA DEPLOYMENT"
echo "===================="
echo ""

# Phase 1: p31ca.org
echo "Phase 1: p31ca.org"
cd /path/to/p31ca.org
cp /shared/schemas/tokens.v2.yml schemas/
cp /shared/styles/quantum-design-system.css src/styles/
npm run build
npm run deploy
echo "✅ p31ca.org deployed"
echo ""

# Phase 2: phosphorus31.org (parallel)
echo "Phase 2: phosphorus31.org"
cd /path/to/phosphorus31.org
cp /shared/schemas/tokens.v2.yml schemas/
cp /shared/styles/quantum-design-system.css src/styles/
npm run build
npm run deploy
echo "✅ phosphorus31.org deployed"
echo ""

# Phase 3: PHOS (parallel)
echo "Phase 3: PHOS"
cd /path/to/phos
cp /shared/schemas/tokens.v2.yml schemas/
cp /shared/styles/quantum-design-system.css src/styles/
npm run build
npm run deploy
echo "✅ PHOS deployed"
echo ""

# Phase 4: WILLOW (parallel)
echo "Phase 4: WILLOW"
cd /path/to/willow
cp /shared/schemas/tokens.v2.yml schemas/
cp /shared/styles/quantum-design-system.css src/styles/
npm run build
npm run deploy
echo "✅ WILLOW deployed"
echo ""

# Validation
echo "VALIDATION"
echo "=========="
p31 lint:spacing
p31 lint:tokens
p31 validate:all
echo ""

echo "✅ TETRA DEPLOYED"
echo "All four platforms now use P31-Q"
```

**Run it:**
```bash
chmod +x deploy-tetra.sh
./deploy-tetra.sh
```

---

## 📋 TIMELINE (Reality)

| Time | Task | Owner | Duration |
|------|------|-------|----------|
| 9:00 | Review this document | Will | 10 min |
| 9:10 | Approve architecture | Will | 2 min |
| 9:12 | Start Phase 1 (p31ca) | Dev | 35 min |
| 9:12 | Start Phase 2 (phosphorus31) | Dev | 35 min (parallel) |
| 9:12 | Start Phase 3 (PHOS) | Dev | 35 min (parallel) |
| 9:12 | Start Phase 4 (WILLOW) | Dev | 35 min (parallel) |
| 9:47 | All deployments finish | Dev | — |
| 9:47 | Run validation checks | QA | 10 min |
| 9:57 | ✅ TETRA IS LIVE | — | — |

**Total time: ~50 minutes**

---

## 💡 WHAT ACTUALLY CHANGES (From User Perspective)

### Before (Today)
- Visit phosphorus31.org → styled one way
- Visit p31ca.org → different styling
- Visit PHOS → weird layout
- Visit WILLOW → "this looks broken"
- **Experience:** Four different products

### After (In 50 Minutes)
- Visit phosphorus31.org → 48px header, cyan colors, fluid spacing
- Visit p31ca.org → same 48px header, same cyan, same spacing
- Visit PHOS → same 48px header, same colors, same tokens
- Visit WILLOW → same but bigger text, same proportions
- **Experience:** One coherent ecosystem

---

## ⚠️ ROLLBACK PLAN (If Something Breaks)

```bash
#!/bin/bash
# rollback-tetra.sh

echo "ROLLING BACK TETRA"
echo ""

# Restore previous versions
git checkout HEAD~1 -- schemas/tokens.v2.yml
git checkout HEAD~1 -- src/styles/quantum-design-system.css

# Redeploy old versions
for dir in p31ca.org phosphorus31.org phos willow; do
  cd /path/to/$dir
  npm run build
  npm run deploy
done

echo "✅ ROLLED BACK"
echo "Previous version restored across all four platforms"
```

**You have 15 minutes to rollback if critical issue detected.**

---

## 🎯 SUCCESS CRITERIA

- [ ] All four platforms load without errors
- [ ] Header height is 48px on all four
- [ ] Crown is perfectly centered on all four
- [ ] Colors are mathematically identical on all four
- [ ] Cross-links work (can navigate between platforms)
- [ ] Lighthouse scores 90+ on all four
- [ ] No console errors on any platform
- [ ] Mobile view works on all four
- [ ] Validation scripts pass on all four

**If all pass → You've successfully unified the Tetra.**

---

## 🔑 CRITICAL LOCKS (Don't Override These)

```css
/* These are locked. Do not change. */
--p31-header-h: 48px;           /* Never change */
--p31-icon-lg-w: 40px;           /* Never change */
--p31-icon-lg-h: 40px;           /* Never change */
--p31-base: 16px;                /* Never change */
--p31-ratio: 1.3333;             /* Never change (4/3) */
--p31-larmor-hz: 863;            /* Never change (physics) */
--p31-color-cyan: oklch(65% 0.18 195);  /* Never change */
```

If you change these, the Tetra falls apart. Don't.

---

## 🚀 ACTION ITEMS (Right Now)

1. **Will:** Read this. Approve.
2. **Dev:** Run `./deploy-tetra.sh`
3. **QA:** Run validation checks
4. **Everyone:** Test cross-platform navigation

**That's it. Everything else is automated.**

---

## The Cage Holds. 863 Hz. K₄ is planar. β₂ = 1.

**One math. Four implementations. Infinite synergy.**

Ready?

```bash
./deploy-tetra.sh
```

Go.
