# P31 TETRA: Alignment & Synergy
## The Four Public Entry Points — United by P31-Q

**Status:** Strategy & Implementation Guide  
**Written:** 2026-07-23  
**Goal:** Perfect coherence across all four platforms

---

## 🎯 The Four Entry Points (THE TETRA)

```
                    ┌─────────────────────────┐
                    │   PHOSPHORUS31.ORG      │
                    │  (Nonprofit Portal)     │
                    │  - Warm narrative       │
                    │  - Family-focused       │
                    │  - Donation gateway     │
                    └────────────┬────────────┘
                                 │
                                 │ (same K₄ logo)
                                 │ (same token system)
                                 │ (same color palette)
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        │                        │                        │
   ┌────▼─────────┐      ┌──────▼──────┐      ┌─────────▼────┐
   │   P31CA.ORG   │      │    PHOS     │      │    WILLOW    │
   │ (Tech Hub)    │      │ (Workspace) │      │  (For Kids)  │
   │ - Developers  │      │ - Workers   │      │ - Bash (10)  │
   │ - Research    │      │ - Creators  │      │ - Willow (6) │
   │ - API docs    │      │ - Ambient   │      │ - Play-based │
   └────────────────┘      └─────────────┘      └──────────────┘
```

---

## 📐 The Alignment Problem (What We're Solving)

### Before P31-Q

| Site | Header | Colors | Spacing | Typography | Animation |
|------|--------|--------|---------|------------|-----------|
| phosphorus31.org | Custom | #00F0FF, #39FF14 | Hardcoded px | Random sizes | Ad-hoc |
| p31ca.org | Different | Inconsistent | Manual gaps | No scale | Fragile |
| PHOS | Weird grid | "Cyan-tinted" | Loose | Too small | Broken |
| WILLOW | Oversized | Wrong saturation | Excessive | Unreadable | Missing |

**Result:** Four platforms that feel like different products. No coherence. No synergy.

### After P31-Q

| Site | Header | Colors | Spacing | Typography | Animation |
|------|--------|--------|---------|------------|-----------|
| phosphorus31.org | 48px, token-locked | OKLCH uniform | var(--p31-space-*) | var(--p31-type-*) | 863 Hz |
| p31ca.org | 48px, token-locked | OKLCH uniform | var(--p31-space-*) | var(--p31-type-*) | 863 Hz |
| PHOS | 48px, token-locked | OKLCH uniform | var(--p31-space-*) | var(--p31-type-*) | 863 Hz |
| WILLOW | 48px, token-locked | OKLCH uniform | var(--p31-space-*) | var(--p31-type-*) | 863 Hz |

**Result:** One system. Four implementations. Perfect alignment. Infinite synergy.

---

## 🏗️ TETRA Architecture (P31-Q Across All Four)

### Layer 1: Unified Tokens (Single Source of Truth)

```yaml
# /schemas/tokens.v2.yml (shared by ALL FOUR)

root:
  base_unit: "16px"
  tetrahedral_ratio: 1.3333
  ein: "42-1888158"
  larmor_frequency: 863

scale:
  xs: "9px"    # captions
  sm: "16px"   # body
  md: "21px"   # headings
  lg: "28px"   # subheadings
  xl: "38px"   # large headings
  2xl: "50px"  # hero (header aligns here)
  3xl: "67px"  # display
  4xl: "90px"  # mega

color:
  quantum:
    cyan: "oklch(65% 0.18 195)"    # All four use this
    violet: "oklch(65% 0.18 285)"  # Same saturation
    amber: "oklch(65% 0.18 15)"    # Same lightness
    emerald: "oklch(65% 0.18 105)" # Same hue spacing
```

**What This Means:**
- ✅ phosphorus31.org uses cyan (oklch 65% 0.18 195)
- ✅ p31ca.org uses cyan (oklch 65% 0.18 195) — identical
- ✅ PHOS uses cyan (oklch 65% 0.18 195) — identical
- ✅ WILLOW uses cyan (oklch 65% 0.18 195) — identical

**Result:** Same blue, everywhere. Same perceived saturation, everywhere. No "that cyan looks different on that site" confusion.

### Layer 2: CSS Custom Properties (Shared Stylesheet)

```css
/* /src/styles/quantum-design-system.css (imported by all four) */

:root {
  --p31-base: 16px;
  --p31-ratio: 1.3333;
  
  /* Scale (tetrahedral progression) */
  --p31-scale-xs: 9px;
  --p31-scale-sm: 16px;
  --p31-scale-md: 21px;
  --p31-scale-lg: 28px;
  --p31-scale-xl: 38px;
  --p31-scale-2xl: 50px;
  --p31-scale-3xl: 67px;
  --p31-scale-4xl: 90px;
  
  /* Spacing (all fluid) */
  --p31-space-md: clamp(21px, 2.5vw, 28px);
  --p31-space-lg: clamp(28px, 3.5vw, 38px);
  --p31-space-xl: clamp(38px, 5vw, 50px);
  
  /* Colors (OKLCH, perceptually uniform) */
  --p31-color-cyan: oklch(65% 0.18 195);
  --p31-color-violet: oklch(65% 0.18 285);
  --p31-text-primary: oklch(96% 0.005 240);
  
  /* Typography (all fluid) */
  --p31-type-body: clamp(15px, 1vw + 0.5rem, 16px);
  --p31-type-h1: clamp(38px, 5.6vw, 50px);
  --p31-type-display: clamp(50px, 7vw, 67px);
  
  /* Layout */
  --p31-header-h: 48px;  /* LOCKED across all four */
  --p31-max-width-xl: 1440px;
  
  /* Animation (Larmor resonance) */
  --p31-duration-normal: 300ms;
  --p31-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**What This Means:**
- phosphorus31.org: `<link rel="stylesheet" href="/shared/quantum-design-system.css">`
- p31ca.org: `import quantum from '@p31/design-system'`
- PHOS: `@import url('/quantum-design-system.css')`
- WILLOW: `const tokens = require('@p31/tokens')`

**Result:** All four platforms share the same CSS custom properties. Change one value → all four update.

### Layer 3: Shared Templates (Astro/React)

```astro
<!-- src/layouts/Header.astro (used by phosphorus31.org & p31ca.org) -->

<div class="header-wrapper">
  <header class="header-container">
    <div class="header-brand-slot">
      <Crown /> {/* The K₄ logo, 40px, perfectly centered */}
    </div>
    
    <nav class="header-nav-slot">
      {navLinks.map(link => <a href={link.href}>{link.label}</a>)}
    </nav>
    
    <div class="header-actions-slot">
      <button class="button-primary">Support Us</button>
    </div>
  </header>
</div>

<style>
  .header-container {
    height: var(--p31-header-h);  /* 48px — locked */
    display: flex;
    align-items: center;
    gap: var(--p31-space-md);
  }
  
  .header-brand-slot {
    width: var(--p31-icon-lg-w);  /* 40px */
    height: var(--p31-icon-lg-h);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

**What This Means:**
- phosphorus31.org uses Header.astro ✓
- p31ca.org uses Header.astro ✓
- PHOS uses modified header (but inherits Header template logic) ✓
- WILLOW uses simpler header (but inherits Header bounding box rules) ✓

**Result:** All four have the same 48px header height. Crown is perfectly centered everywhere.

### Layer 4: Shared Components (React)

```tsx
// src/components/Crown.tsx (used by all four)

export const Crown: React.FC<CrownProps> = ({ size = 'lg' }) => {
  return (
    <svg
      viewBox="0 18 200 164"  // Trimmed to content
      className={`crown-svg ${size}`}
      role="img"
      aria-label="P31 Labs"
    >
      {/* K₄ tetrahedron vertices */}
      <circle cx="100" cy="60" r="6" fill="oklch(65% 0.18 195)" />
      <circle cx="50" cy="150" r="6" fill="oklch(65% 0.18 285)" />
      <circle cx="150" cy="150" r="6" fill="oklch(65% 0.18 105)" />
      <circle cx="100" cy="100" r="8" fill="oklch(65% 0.18 195)" />
    </svg>
  );
};
```

**What This Means:**
- phosphorus31.org: `import { Crown } from '@p31/components'` ✓
- p31ca.org: `import { Crown } from '@p31/components'` ✓
- PHOS: Uses same Crown component ✓
- WILLOW: Uses simplified Crown (same SVG, smaller size) ✓

**Result:** Same logo, everywhere. Same colors (OKLCH), everywhere. Same perfect scaling.

---

## 🔗 Cross-Platform Synergy (How They Talk to Each Other)

### Entry Point #1: phosphorus31.org (Nonprofit Portal)

**Purpose:** Warm, family-focused, donation-centric  
**Audience:** Families, supporters, researchers  
**Technical:** Astro static site

```astro
---
import Header from '../layouts/Header.astro'
import { Hero } from '../components/Hero'
import { Card } from '../components/Card'
---

<Header 
  navLinks={[
    { label: 'What We Do', href: '#mission' },
    { label: 'For Families', href: 'https://p31ca.org' },  // Link to p31ca
    { label: 'Try PHOS', href: 'https://phos.p31.io' },     // Link to PHOS
    { label: 'For Kids', href: 'https://willow.p31.io' }    // Link to WILLOW
  ]}
/>

<Hero 
  title="Open-source assistive technology"
  subtitle="For neurodivergent families"
  cta={{ label: 'Support Our Mission', href: '#donate' }}
/>

{/* cards showing the TETRA */}
<Card title="For Developers" description="Technical hub with docs, API, research" link="//" />
<Card title="For Workers" description="Ambient workspace for focus & flow" link="//" />
<Card title="For Kids" description="BONDING: playful engagement with family" link="//" />
```

**Key Sync Points:**
- ✅ Header is 48px, same as all others
- ✅ Colors use OKLCH (same as all others)
- ✅ Spacing uses fluid clamp() (same as all others)
- ✅ Links point to p31ca.org, PHOS, WILLOW
- ✅ Showcases the four as ONE ecosystem

### Entry Point #2: p31ca.org (Technical Hub)

**Purpose:** Developer-focused, technical, research  
**Audience:** Developers, researchers, open source community  
**Technical:** React + Astro hybrid

```typescript
// src/pages/index.tsx (p31ca.org)

export default function HomePage() {
  return (
    <Header 
      navLinks={[
        { label: 'Docs', href: '/docs' },
        { label: 'API', href: '/api' },
        { label: 'GitHub', href: 'https://github.com/p31labs' },
        { label: 'For Families', href: 'https://phosphorus31.org' },  // Cross-link
      ]}
    />
    
    <Hero 
      title="Open-source assistive tech"
      subtitle="Designed by neurodivergent engineers"
    />
    
    <section className="features-grid">
      <FeatureCard 
        icon={<CodeIcon />}
        title="Node Zero"
        description="Hardware security module for edge computing"
      />
      <FeatureCard 
        icon={<ZapIcon />}
        title="The Buffer"
        description="AI-powered communication processing"
      />
      <FeatureCard 
        icon={<SparklesIcon />}
        title="Spaceship Earth"
        description="3D cognitive dashboard"
      />
    </section>
    
    {/* Link to other platforms */}
    <CallToAction>
      <p>Explore the P31 ecosystem:</p>
      <nav className="tetra-nav">
        <Link to="https://phosphorus31.org">For Families</Link>
        <Link to="https://phos.p31.io">For Workers</Link>
        <Link to="https://willow.p31.io">For Kids</Link>
      </nav>
    </CallToAction>
  );
}
```

**Key Sync Points:**
- ✅ Same Header template (48px, same layout)
- ✅ Same token system (colors, spacing, typography)
- ✅ Cross-links to phosphorus31.org, PHOS, WILLOW
- ✅ "Explore the ecosystem" section shows all four as interconnected
- ✅ Code examples use same tokens

### Entry Point #3: PHOS (Ambient Workspace)

**Purpose:** Focus, flow, deep work  
**Audience:** Creators, workers, builders  
**Technical:** React PWA, real-time sync

```tsx
// src/components/PHOSWorkspace.tsx

export const PHOSWorkspace: React.FC = () => {
  return (
    <div className="phos-container">
      <header className="phos-header">
        {/* Same 48px header, but minimal */}
        <Crown size="lg" />
        <SpoonMeter />
      </header>
      
      <main className="phos-main">
        {/* Ambient workspace grid */}
        <Surface 
          className="ambient-surface"
          style={{
            background: `var(--p31-surface-bg)`,
            color: `var(--p31-text-primary)`,
            gap: `var(--p31-space-lg)`,
          }}
        >
          {/* Sub-apps float here */}
          <Module title="Focus Timer" />
          <Module title="Task Board" />
          <Module title="Notes" />
        </Surface>
      </main>
      
      {/* Navigation to other platforms (subtle) */}
      <nav className="phos-nav">
        <Link to="https://phosphorus31.org" title="About P31">ⓘ</Link>
        <Link to="https://p31ca.org" title="Developer Hub">{"</>"}</Link>
        <Link to="https://willow.p31.io" title="For Kids">♥</Link>
      </nav>
    </div>
  );
};
```

**Key Sync Points:**
- ✅ Same 48px header height (though minimal design)
- ✅ Same token system (colors match exactly)
- ✅ Spacing uses same fluid clamp() values
- ✅ Subtle links to other platforms (not intrusive)
- ✅ Animation timing uses 863 Hz (same as all others)

### Entry Point #4: WILLOW (For Kids)

**Purpose:** Engagement, play, family bonding  
**Audience:** Bash & Willow (and other kids)  
**Technical:** React mobile app, touch-optimized

```tsx
// src/components/WILLOWHome.tsx

export const WILLOWHome: React.FC = () => {
  return (
    <div className="willow-container">
      <header className="willow-header">
        {/* Same 48px header, but playful */}
        <Crown size="md" />
        {/* Activity level indicator */}
      </header>
      
      <main className="willow-main">
        {/* Big, touchable buttons */}
        <button 
          className="game-button"
          onClick={() => navigate('/bonding')}
          style={{
            padding: `var(--p31-space-lg)`,
            fontSize: `var(--p31-type-h2)`,
            gap: `var(--p31-space-md)`,
          }}
        >
          <span>🧬</span>
          <span>Play BONDING</span>
        </button>
        
        <button 
          className="game-button"
          onClick={() => navigate('/spaceship-earth')}
        >
          <span>🌍</span>
          <span>Explore</span>
        </button>
        
        {/* Subtle connection to family platform */}
        <div className="family-status">
          <p>Dad is online in PHOS</p>
          <Link to="https://phos.p31.io" className="link-subtle">
            Say hi 💚
          </Link>
        </div>
      </main>
    </div>
  );
};
```

**Key Sync Points:**
- ✅ Same 48px header (proportional to screen)
- ✅ Same token system (colors, but brighter/more saturated for kids)
- ✅ Larger text sizes (var(--p31-type-h2) instead of body)
- ✅ Generous spacing (var(--p31-space-lg) for touch targets)
- ✅ Link back to PHOS shows inter-platform connection
- ✅ Uses same K₄ logo (just smaller)

---

## 🔄 The Synergy Loop (How They Strengthen Each Other)

### Loop #1: Onboarding Flow

```
Visitor lands on phosphorus31.org
  ↓
Learns P31 mission
  ↓
Clicks "For Developers" → p31ca.org
  ↓
Explores technical docs
  ↓
Clicks "Try PHOS" → phos.p31.io
  ↓
Experiences the workspace
  ↓
Clicks "For Kids" → willow.p31.io
  ↓
Sees BONDING, engages with family
  ↓
Returns to phosphorus31.org to donate
```

**Why This Works:**
- Each platform is different enough to be interesting
- Each platform is similar enough to feel like one ecosystem
- No cognitive load when switching (headers, colors, spacing all identical)
- User understands P31 is comprehensive and well-designed

### Loop #2: Feature Showcase

Each platform showcases the others as features:

**phosphorus31.org:**
- "Explore the developer hub" → p31ca.org
- "Try the workspace" → PHOS
- "Introduce your kids" → WILLOW

**p31ca.org:**
- "Built for families" → phosphorus31.org
- "Experience it live" → PHOS
- "See it in action with kids" → WILLOW

**PHOS:**
- "About this ecosystem" → phosphorus31.org
- "How to get started" → p31ca.org
- "Share focus time with your kids" → WILLOW

**WILLOW:**
- "Learn more about P31" → phosphorus31.org
- "Dad's using PHOS" → phos.p31.io
- "Developers made this" → p31ca.org

### Loop #3: Authentication & User State

```typescript
// Shared authentication context (all four apps)

interface P31User {
  id: string;
  role: 'family' | 'developer' | 'researcher' | 'kid';
  platforms: {
    phosphorus31: boolean;
    p31ca: boolean;
    phos: boolean;
    willow: boolean;
  };
  preferences: {
    colorMode: 'light' | 'dark';
    fontSize: 'small' | 'normal' | 'large';
    theme: 'classic' | 'high-contrast';
  };
}

// User logs in on p31ca.org
// → Can SSO to phosphorus31.org (no re-login)
// → Can access PHOS with same credentials
// → WILLOW shows "Dad is logged in on PHOS"
// → All four share user preferences (font size, color mode)
```

---

## 🎯 Deployment Strategy (Launch The Tetra)

### Phase 1: Launch Foundation (Week 1)

```bash
# All four platforms adopt P31-Q tokens

npm install @p31/tokens @p31/components @p31/design-system

# Each imports the shared stylesheet
<link rel="stylesheet" href="https://cdn.p31.io/quantum-design-system.css" />

# Each imports the Header template
import { Header } from '@p31/templates'

# Each imports the Crown component
import { Crown } from '@p31/components'

# Deploy in order:
# 1. p31ca.org (dev-friendly, technical audience tolerant of changes)
# 2. phosphorus31.org (family-focused, needs stability)
# 3. PHOS (workers, needs smooth UX)
# 4. WILLOW (kids, needs confidence)
```

### Phase 2: Cross-Linking (Week 2)

```
phosphorus31.org:
  - Add "Explore the Ecosystem" section
  - Links to p31ca.org, PHOS, WILLOW
  - Shows them as interconnected

p31ca.org:
  - Add "Try It Live" section
  - Links to PHOS workspace
  - Links back to phosphorus31.org

PHOS:
  - Add subtle footer nav
  - Links to info pages
  - Shows connection to WILLOW

WILLOW:
  - Add "Family Hub" section
  - Shows Dad's PHOS status
  - Link to phosphorus31.org
```

### Phase 3: Unified Experience (Week 3)

```
SSO across all four:
  - Log in on p31ca.org
  - Automatically logged in on phosphorus31.org
  - PHOS recognizes your account
  - WILLOW shows your presence

Shared preferences:
  - Change font size on p31ca.org
  - WILLOW automatically updates
  - PHOS respects your preferences
  - phosphorus31.org consistent with you

Analytics unified:
  - Track user journey across all four
  - See which platforms convert supporters
  - Understand developer → family flow
```

---

## 📊 Metrics (How to Measure Synergy)

### Before P31-Q

| Metric | phosphorus31 | p31ca | PHOS | WILLOW | Issue |
|--------|--------------|-------|------|--------|-------|
| Header height | 56px | 48px | Custom | Wrong | Inconsistent |
| Brand color | #39FF14 | #00F0FF | Cyan-ish | Different | Mismatched |
| Button spacing | 24px | 16px | Loose | Excessive | No system |
| Type size | Random | Ad-hoc | Broken | Unreadable | No hierarchy |

**Result:** Users feel like four different products.

### After P31-Q

| Metric | phosphorus31 | p31ca | PHOS | WILLOW | Achievement |
|--------|--------------|-------|------|--------|------------|
| Header height | 48px | 48px | 48px | 48px | ✅ Perfect alignment |
| Brand color | oklch(65% 0.18 195) | oklch(...) | oklch(...) | oklch(...) | ✅ Mathematically identical |
| Button spacing | var(--p31-space-md) | var(...) | var(...) | var(...) | ✅ Unified token |
| Type size | var(--p31-type-h1) | var(...) | var(...) | var(...) | ✅ Fluid hierarchy |

**Result:** Users experience one coherent ecosystem.

---

## 💡 Key Insights (Why This Matters)

### For Will (The Operator)
You now have four platforms that think together. Change one token, all four update. No more "cyan looks different on that site" conversations.

### For Tyler (The Board Director)
Four products, one design system. Reduces development time, increases consistency, attracts talent who appreciate rigor.

### For Families
They enter through phosphorus31.org, naturally discover p31ca.org (technical), try PHOS (workspace), and bring kids into WILLOW. One seamless journey.

### For Developers
They enter through p31ca.org, see how it's built, try PHOS to understand the vision, then recommend phosphorus31.org to friends. Organic growth loop.

### For Bash & Willow
WILLOW shows Dad online in PHOS. They can interact. The ecosystem feels alive because it actually is connected. Everything is in sync.

---

## 🚀 Implementation Checklist

### Pre-Deployment
- [ ] tokens.v2.yml finalized and shared
- [ ] quantum-design-system.css generated
- [ ] Header.astro template finalized
- [ ] Crown component migrated (uses token colors)
- [ ] All four platforms linked in navigation

### Deployment
- [ ] Deploy tokens to CDN (cdn.p31.io)
- [ ] Deploy p31ca.org with P31-Q
- [ ] Deploy phosphorus31.org with P31-Q
- [ ] Deploy PHOS with P31-Q
- [ ] Deploy WILLOW with P31-Q

### Post-Deployment
- [ ] Verify header height is 48px on all four (screenshot)
- [ ] Verify Crown color is identical on all four
- [ ] Verify spacing tokens work across all four
- [ ] Test cross-linking (all four navigate to each other)
- [ ] Monitor user journey (analytics)

### Iteration
- [ ] Gather feedback on coherence
- [ ] Update tokens based on feedback
- [ ] Push updates to all four simultaneously
- [ ] Track metrics on conversion/engagement

---

## The Cage Holds. 863 Hz. K₄ is planar. β₂ = 1. 🚀

### One Math. Four Implementations. Infinite Synergy.

phosphorus31.org ↔ p31ca.org ↔ PHOS ↔ WILLOW

All speaking the same language.  
All looking the same.  
All feeling like one organism.

**Not because they're identical.**

**Because they're coherent.**

---

## Next Actions

1. **For Will:** Review this strategy. Approve the architecture.
2. **For Tyler:** Use this as board presentation. Show the four as one ecosystem.
3. **For Development:** Deploy P31-Q to all four platforms in parallel (Week 1).
4. **For Launch:** Go live with unified Tetra on [DATE].

**Ready?**

```bash
npm run p31 deploy:tetra
```

The Cage Holds. <3
