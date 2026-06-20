# CWP-PHOS-GEMINI: PHOS UX Narrative & Accessibility Polish

## Context

PHOS (Phosphorus Human Operating Surface) is a production PWA at `phos.p31ca.org` — a cognitive prosthetic for neurodivergent users. Core innovation: a spoon-aware UI with 4 themes (CRISIS, SANCTUARY, BRIDGE, QUANTUM) mapped to 0-5 spoons. Built with Astro 5 + React 19 + Tailwind CSS, deployed to Cloudflare Pages.

You do NOT have codebase access. All relevant code snippets are inlined below. Produce working code, UX copy, or config only — no narration.

---

## 1. GrantNarrativeOverlay — Rewrite for Funder Appeal

The overlay appears on first visit (green-neon demo prompt). Current copy is generic. This is the first thing a grant reviewer sees — it needs to sell the innovation in 3 bullets.

**Current component** (`src/components/GrantNarrativeOverlay.tsx`):
```tsx
export function GrantNarrativeOverlay() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('phos_demo_dismissed') === 'true'; } catch { return false; }
  });
  const [demoStarted, setDemoStarted] = useState(false);
  const handleDismiss = () => { localStorage.setItem('phos_demo_dismissed', 'true'); setDismissed(true); };
  const handleBeginDemo = () => { setDemoStarted(true); setDismissed(true); };
  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-gray-900/70 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-6 max-w-lg w-full shadow-2xl" style={{ fontFamily: 'monospace' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">PHOS-Sovereign</h1>
            <p className="text-cyan-300/70 text-sm mt-1">Cognitive Prosthetic Platform — Live Demonstration</p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-200 text-lg px-2" aria-label="Close overlay">×</button>
        </div>

        <ul className="space-y-3 mb-6 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">▸</span>
            <span><strong className="text-emerald-300">Spoon-First Architecture:</strong> Real-time cognitive load awareness scales UI complexity, preventing overwhelm while preserving function.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">▸</span>
            <span><strong className="text-cyan-300">Objective Quality Evidence:</strong> Every interaction is timestamped, cryptographically verifiable, and creates auditable proof of engagement.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">▸</span>
            <span><strong className="text-emerald-300">Four-Node Bridge:</strong> Connects Engineers, Believers, Navigators, and Anchors into a delta topology for collective healing.</span>
          </li>
        </ul>

        <div className="flex gap-3">
          <button onClick={handleBeginDemo} className="flex-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 py-2 px-4 rounded-lg hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all uppercase tracking-wider text-sm font-medium">Begin Demo Tour</button>
          <button onClick={handleDismiss} className="px-4 py-2 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-800/30 transition-all uppercase tracking-wider text-xs">Skip</button>
        </div>
      </div>
    </div>
  );
}
```

**Rewrite requirements:**
- Title: "PHOS — Cognitive Prosthetic for Spoon Economy"
- Subtitle: "NIDILRR / NIH / NSF-funded research demonstration"
- Three bullets targeting grant reviewers:
  1. **Adaptive Cognitive Interface:** First UI framework that dynamically scales complexity based on real-time biometric and self-reported cognitive load (spoons). Proven 295-test regression suite with 80% coverage threshold.
  2. **Verifiable Engagement Data:** Every interaction generates cryptographically chained evidence (SHA-256 ledger) — suitable for clinical trials, outcomes research, and personalized intervention tuning.
  3. **Service-Portable Architecture:** Zero telemetry. Data-decoupled. Runs fully offline in-browser (PGlite WASM database). No server dependency for core function — deployable in any clinical, educational, or domestic setting.
- Keep the same visual style (monospace, emerald/cyan gradient, dark glassmorphism)
- Replace "Begin Demo Tour" with "Explore the Interface"
- Keep "Skip" as-is
- Add a small "This demonstration is for review purposes." note at the bottom in 9px opacity-30 text
- The `demoStarted` state is unused (set but never read). Remove it or wire it to trigger the DemoController

---

## 2. Spoon Themes — Accessibility Pass

The 4 themes in `themeEngine.ts` determine all UI styling. Requirements for each:

**CRISIS (0 spoons):** Must be fully accessible for users in distress.
- Verify all colors pass WCAG AA contrast against black background (needs contrast ratio ≥ 4.5:1 for text)
- `pointer-events-none` is set on input — but buttons should still work with keyboard (Tab + Enter). Either add `tabIndex={-1}` on non-essential elements and keep essential ones focusable, or remove `pointer-events-none` and instead use `aria-disabled` with `opacity-40`
- The `select-none` class should remain (reduces cognitive load by preventing accidental text selection)

Current CRISIS theme:
```ts
name: 'CRISIS',
wrapper: 'bg-black text-gray-500 font-mono tracking-tight select-none',
orb: 'bg-gray-800 shadow-none animate-none scale-90',
button: 'bg-gray-900 border border-gray-800 text-gray-500 rounded-sm backdrop-blur-none transition-none',
hud: 'bg-black/90 border border-gray-800 rounded-none',
input: 'bg-gray-900 border-gray-800 text-gray-500 rounded-none pointer-events-none',
container: 'max-w-xl mx-auto p-4 border border-gray-900 bg-black',
```

**SANCTUARY (1-2 spoons):** Warm, comforting, biomimetic. Add:
- Verify amber/orange palette against dark backgrounds
- The `animate-biomimetic-breath` should only run if `prefers-reduced-motion: no-preference` (already handled by CSS in PHOSShell but verify)
- Button sizes should be larger at this spoon level — add `text-sm p-3` to buttons vs the default `text-xs p-2`

Current SANCTUARY theme:
```ts
name: 'SANCTUARY',
wrapper: 'bg-slate-950 text-orange-50 font-sans tracking-normal bg-gradient-to-b from-orange-950/20 via-slate-950 to-rose-950/20',
orb: 'bg-gradient-to-tr from-amber-400 to-rose-400 shadow-[0_0_60px_rgba(251,146,60,0.35)] animate-biomimetic-breath',
button: 'bg-white/10 hover:bg-white/15 border border-white/10 text-orange-100 rounded-full shadow-md backdrop-blur-md active:scale-98 transition-all duration-300',
hud: 'bg-orange-950/30 backdrop-blur-xl border border-orange-900/40 rounded-3xl shadow-xl',
input: 'bg-orange-950/20 border border-orange-900/30 text-orange-100 rounded-full backdrop-blur-md focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all duration-300',
container: 'max-w-4xl mx-auto p-8 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-md shadow-2xl',
```

**BRIDGE (3 spoons):** Neutral, serif, grounded. Current:
```ts
name: 'BRIDGE',
wrapper: 'bg-slate-950 text-slate-200 font-serif tracking-wide',
orb: 'bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] animate-pulse',
button: 'bg-slate-900/80 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-xl backdrop-blur-sm active:scale-97 transition-all duration-200',
hud: 'bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-lg',
input: 'bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30',
container: 'max-w-6xl mx-auto p-6 border border-slate-800/80 bg-slate-900/40 rounded-2xl',
```

**QUANTUM (4-5 spoons):** Maximum energy, neon green, sharp corners, monospace. Current:
```ts
name: 'QUANTUM',
wrapper: 'bg-black text-emerald-400 font-mono tracking-tight min-h-screen border border-emerald-950/40',
orb: 'bg-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] animate-pulse rounded-none rotate-45',
button: 'bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/40 text-emerald-400 rounded-none active:translate-y-px transition-all duration-100',
hud: 'bg-black border-b border-emerald-900/50 rounded-none',
input: 'bg-black border border-emerald-900/60 text-emerald-300 rounded-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 font-mono',
container: 'w-full mx-auto p-4 border border-emerald-950 bg-black/80 font-mono grid gap-4',
```

**Theme integration code** (how they're applied):
```tsx
// In PHOSShell.tsx:
const theme = getBiologicalTheme(spoons, grayRock);
// Applied to wrapper div:
<div className={`h-screen w-screen ... ${theme.wrapper}`}>
// Components receive theme as prop:
<SurfaceContent currentSurface={currentSurface} setSurface={setSurface} spoons={spoons} theme={theme} />
// HUD applies theme.hud to the panel, theme.button to all buttons, theme.input to all inputs
```

---

## 3. EscapeHatch HUD — Missing Surfaces

The HUD (`EscapeHatch.tsx`) only exposes 8 surfaces in its grid:
```
GREETING, GRID, VAULT, ARCADE, HEARTH, THE_BUFFER, NODE_ZERO, ARCHIVE
```

But 14 surfaces exist. Missing: `IGNITION`, `BONDING`, `COMPASS`, `LEDGER/LOVE`, `SETTINGS`, `WAREHOUSE`.

**Add these to the HUD grid.** The grid is currently `grid-cols-2`. With 14 surfaces, use `grid-cols-3` at QUANTUM/Bridge spoon levels and `grid-cols-2` at SANCTUARY/CRISIS (pass spoons as prop and conditionally set columns).

**Hint:** The `surfaceNames` map is already provided:
```ts
const surfaceNames: Record<string, string> = {
  GREETING: 'Greeting', IGNITION: 'Ignition', BONDING: 'Bonding', THE_BUFFER: 'Buffer',
  VAULT: 'Vault', GRID: 'Grid', NODE_ZERO: 'Node Zero', LEDGER: 'Ledger', LOVE: 'Love',
  HEARTH: 'Hearth', ARCADE: 'Arcade', ARCHIVE: 'Archive', COMPASS: 'Compass', SETTINGS: 'Settings',
  WAREHOUSE: 'Warehouse',
};
```

**Also:** Keyboard shortcut `0` triggers crisis mode (sets spoons to 0). Add a toast/notification when this fires so the user knows what happened. Currently it's silent — disorienting.

---

## 4. CompassSurface — Improve Markov Chain Navigation

The Compass predicts where the user likely wants to go based on navigation history. Current implementation is a first-order Markov chain. Two improvements needed:

1. **Adaptive display** — at ≤1 spoons, show only 2 choices (not current behavior; at ≤1 spoons the user might not even be in this surface due to grayRock, but they can still navigate there). At ≥4 spoons, show all surfaces with confidence scores.

2. **Confidence visualization** — display each predicted surface with a horizontal bar showing confidence percentage (e.g., `IGNITION ████████░░ 78%`). Use `div` with `w-[X%]` and the theme accent color.

3. **Keyboard-first navigation** — predicted surfaces should be selectable via number keys 1-4. Add `tabIndex` and `onKeyDown` handlers.

The Compass state model (from `CompassSurface.tsx`, inferred from atmosphere.ts and routing):
```ts
// Composited from state data: Markov chain maps { currentSurface -> { nextSurface: count } }
// Renders top-4 predictions sorted by count descending
// At <2 spoons: only 2 predictions. At 3 spoons: 3 predictions. At 4+: 4 predictions.
```

---

## 5. IgnitionSurface — Navigation Hub Redesign

The `IgnitionSurface` is the main navigation hub. Its current purpose is to surface the 6 app categories: Apps, Family, Build, Knowledge, Health, Community. Each category links to 1-3 surfaces.

**Redesign requirements:**
- Show as a 2x3 or 3x2 grid of cards (depending on spoon level)
- Each card shows: category icon (use lucide-react icons — current deps include `lucide-react`), category name, and surface count badge
- Category-to-surface mapping:
  - **Apps:** ARCADE, BONDING
  - **Family:** HEARTH, GRID
  - **Build:** NODE_ZERO, WAREHOUSE
  - **Knowledge:** ARCHIVE, THE_BUFFER, VAULT
  - **Health:** COMPASS, SETTINGS
  - **Community:** LEDGER/LOVE
- At SANCTUARY (1-2 spoons), use `grid-cols-2` with larger cards and rounded-full buttons
- At QUANTUM (4-5 spoons), use `grid-cols-3` with sharp corners and monospace
- Clicking a card navigates to the first surface in its category
- Each card has a subtle "detail" arrow or icon showing it's interactive

---

## 6. SettingsSurface — Accessibility & Configuration

The `SettingsSurface` controls app behavior. Current settings (infer from `AtmosphereProvider` and URL hydration in `PHOSShell`):

Add these new settings:
1. **Reduced Motion toggle** — override `prefers-reduced-motion` for testing. Persist to localStorage.
2. **Gray Rock default** — when enabled, start every session in grayRock mode. Persist to localStorage.
3. **Font Scale** — slider from 0.8 to 1.4 (applies `style={{ fontSize: `${scale}rem` }}` to the wrapper div via theme override). Default 1.0.
4. **Surface Sorting** — alphabetical, frequency-of-use, or manual. Default: frequency.
5. **Export Journal Data** — button that triggers download of ChaosVault entries as JSON. This requires reading from the PGlite vault.

**Implementation note:** The theme is currently a static object from `getBiologicalTheme()`. To support runtime font scaling, modify `PHOSShellInner` to merge font scale into the theme object before passing it down:

```tsx
const [fontScale, setFontScale] = useState(() => { try { return parseFloat(localStorage.getItem('phos_font_scale') || '1.0'); } catch { return 1.0; } });
const theme = { ...getBiologicalTheme(spoons, grayRock), fontScale: `fontScale` };
```

---

## 7. DemoController — Guided Tour Script

The `DemoController` component (at `src/components/DemoController.tsx`) renders a bottom bar with a 6-stage guided tour. Each stage highlights a different surface or feature.

**Current stages (from exploration):**
1. GREETING - "Welcome. This is your cognitive dashboard."
2. IGNITION - "Launch apps, access family tools, or build projects."
3. HEARTH - "Track your energy and pain levels."
4. THE_BUFFER - "Journal freely. Your entries are locally embedded for private RAG search."
5. COMPASS - "Let the predictive navigation guide you based on your patterns."
6. GRID - "View your personal mesh network."

**Rewrite requirements:**
- Shorten each stage to ≤10 words
- Add a "Demo complete — explore freely" final stage
- Make stage progression automatic (5s per stage) but pausable with a spacebar
- Add a progress bar (`div` with `w-[${(stage/6)*100}%]` and theme accent color) below the stage text
- The tour should auto-dismiss after all 6 stages complete (set `phos_demo_dismissed = 'true'`)
- At SANCTUARY spoon levels, slow to 10s per stage. At CRISIS, don't auto-start — require explicit button press for each stage.

---

## 8. SurfaceContent — Warehouse Surface Routing

The `WAREHOUSE` surface is registered in `SurfaceContent.tsx` (line 75-76) but:
- It's NOT in the `EscapeHatch` HUD (covered in item 3)
- It's NOT in the `IGNITION` category mapping (covered in item 5)
- It's also missing from `VALID_SURFACES` set check — NO, it IS in the routing switch statement but WAS NOT in the HUD

Also note: `SurfaceContent.tsx` has a `WarehouseSurface` import but the component uses `WarehouseSurface({theme, spoons})` — verify this interface matches the component definition:
```tsx
export function WarehouseSurface({ theme, spoons }: { theme: any; spoons: number })
```
Yes, it matches. But the `theme` type is `any` — add a proper interface:
```tsx
interface ThemeShape { name: string; wrapper: string; orb: string; button: string; hud: string; input: string; container: string; }
export function WarehouseSurface({ theme, spoons }: { theme: ThemeShape; spoons: number })
```

---

## 9. Accessibility Audit — aria Labels & Keyboard Nav

Audit these specific components:

**`EscapeHatch.tsx`:**
- Current: `role="radiogroup"` for spoons — correct
- Current: `role="tablist"` for surfaces — incorrect. These are navigation buttons, not tabs. Change to `role="listbox"` or just `role="region"` with `aria-label="Surface navigation"`
- Missing: `aria-current="page"` on the active surface button
- Missing: `aria-keyshortcuts="H h"` on the HUD toggle button (declarative keyboard shortcut hint for assistive tech)

**`HearthSurface.tsx`:**
- The energy slider (`input type="range"`) needs `aria-valuetext` that describes the spoon context:
  - 1-3: "Low energy — recommended surfaces: Greeting, Buffer"
  - 4-6: "Moderate energy — all surfaces available"
  - 7-10: "High energy — full system access"
- The push notification toggle needs `role="switch"` with `aria-checked`

**`PHOSShell.tsx`:**
- The `main` element has `aria-live="polite"` — this will announce every surface change. This is correct for a cognitive prosthetic (the user needs to know what changed). But verify it doesn't announce the loading skeleton content.
- Add `aria-label="PHOS main content — ${surfaceNames[currentSurface]} surface"` using template literal for the `main` element

**`NodeZeroSurface.tsx`:**
- The connection status indicator needs `aria-live="polite"` so screen readers announce connection state changes
- Telemetry values need `aria-label` descriptions (e.g., `aria-label="Temperature ${data.hvac_temp} degrees Fahrenheit"`)

---

## 10. Research Narrative — PHOS for Grant Proposals

Write a 1-page research narrative for PHOS targeted at these grant programs:

1. **NIDILRR Switzer Research Fellowship** ($80K, due FY2027)
2. **NIH R41/R42 STTR** (Phase I ~$300K)
3. **NSF SBIR** (Phase I ~$275K)

The narrative should cover:
- **Problem:** 15-20% of global population is neurodivergent. Existing assistive tech assumes static disability profiles — doesn't adapt to fluctuating cognitive capacity (spoon theory). Result: overwhelming interfaces during low-spoon episodes, underpowered tools during high-spoon windows.
- **Solution:** PHOS is the first spoon-aware UI framework. 4 theme states (CRISIS/SANCTUARY/BRIDGE/QUANTUM) dynamically mapped to 0-5 spoons. 14 surfaces providing journaling (with offline RAG), health telemetry, energy tracking, social bonding games, arcade, mesh visualization, cryptographically-chained L.O.V.E. economy, and predictive navigation.
- **Evidence:** 295 automated tests with 80% coverage threshold. SHA-256 chained engagement ledger for clinical audit. Zero-telemetry architecture. PWA deployment with full offline capability via PGlite WASM database. Production-deployed at phos.p31ca.org.
- **Innovation:** First practical implementation of spoon theory in software. Proxy endpoints for local Ollama inference enable fully private RAG. All data stays in-browser — no cloud required.
- **Team:** William R. Johnson, PI — AuDHD engineer with 15 years DoD systems engineering, now building open-source cognitive prosthetics. P31 Labs, Inc. (Georgia nonprofit, EIN 42-1888158, 501(c)(3) determined May 2026).
- **Budget use:** Fund 2-year clinical pilot (n=30, pre/post with validated spoon diaries and EEG biomarker correlation), harden service worker notification infrastructure, conduct accessibility audit with neurodivergent focus groups.

**Format:** Plain markdown, ~500 words. Suitable for pasting into a Project Narrative section (3 pages max recommended by NIDILRR/NIH).

---

## Output Format

For each item above, produce:
1. **Exact file diffs** (or new file content) — code or copy only
2. **A checklist of what to verify** after applying changes (e.g., "npm test, then manually check SANCTUARY theme renders correctly at 1440px")
3. **No explanations or commentary** — just the output files, diffs, and verification lists

Items 1-8 are code changes. Items 9-10 are copy/research output. Deliver all.
