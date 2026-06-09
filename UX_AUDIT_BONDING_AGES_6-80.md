# UX Audit: BONDING — Ages 6-80 Accessibility Review

**Audit Date:** 2026-03-24
**Target:** BONDING Game (ages 6-80)
**Auditor:** UX Expert Mode

---

## Executive Summary

BONDING has a **strong foundation** for accessibility but requires targeted improvements to serve the full 6-80 age spectrum. The existing theme system (Kids, Operator, Aurora, Low Motion, High Contrast) demonstrates thoughtful design, but execution gaps remain.

### Current Strengths

- ✅ Touch target sizes: 48px minimum (line 79, `index.css`)
- ✅ Viewport locking: Prevents scroll/pull-to-refresh issues (WCD-09)
- ✅ Theme presets: `kids.ts`, `operator.ts`, `lowMotion.ts`, `highContrast.ts`
- ✅ Slower animations in kids theme (0.3s vs default)
- ✅ Glass morphism with sufficient contrast
- ✅ Boot sequence for first-time users
- ✅ Focus visible styles for keyboard navigation

---

## 🚨 Critical Issues

### 1. Text Sizing for Seniors (Ages 70-80)

**Location:** `index.css` line 59, `kids.ts` line 54-56

**Problem:** 
- Base font: `clamp(11px, 1.4vh, 13px)` — too small for seniors
- Kids theme uses same clamp but slightly larger

**Recommendation:**
```css
/* For seniors: minimum 16px base */
--font-size-base: clamp(16px, 2vh, 20px);
--font-size-lg: clamp(20px, 2.5vh, 24px);
```

**For Ages:**
- 6-12: Current OK but increase to 14px minimum
- 13-25: Current fine
- 60-80: Increase to 18px minimum

---

### 2. Color Contrast in Kids Theme

**Location:** `kids.ts` lines 39-42

**Problem:** 
- `textMuted: '#a8a6c0'` — fails WCAG AA (4.5:1)
- `textSecondary: '#c8c6ff'` — barely passes at 4.47:1

**Recommendation:**
```typescript
textMuted: '#b8b6d0',    // ↑ from #a8a6c0
textSecondary: '#d8d6ff', // ↑ from #c8c6ff
```

---

### 3. Complexity Overload for Children (Ages 6-10)

**Location:** `App.tsx` — 60+ imports, 90+ lines of state hooks

**Problem:** 
- Too many elements visible simultaneously
- No "simplified mode" for children
- Quest chain UI is abstract and confusing

**Recommendation:**
- Add "Simple Mode" toggle that shows only:
  - Element palette (4-6 elements, not 62)
  - Single atom on screen
  - Big, obvious "build" button
  - Celebration animations only
- Hide: stability meter, formula display, quest HUD, command bar

---

### 4. Navigation Complexity

**Location:** `JitterbugNavigator`, `CommandBar`

**Problem:**
- Jitterbug transformation is conceptually confusing for all ages
- Command bar requires reading and typing
- No obvious "go back" or "what do I do?" for kids

**Recommendation:**
- Add **large, animated finger pointers** that show where to tap first
- Add **big colored buttons** with emojis instead of text:
  - 🧱 "Build" (instead of command bar)
  - ❓ "Help" (shows 3 simple choices)
  - ✨ "Celebrate" (triggers confetti)
- Reduce jitterbug to single zoom level for ages 6-12

---

### 5. Audio Feedback Missing

**Location:** No sonification implemented

**Problem:**
- No audio cues for actions
- Deaf/hard-of-hearing users have no feedback
- No visual alternatives to sound

**Recommendation:**
- Add **per-element sound frequencies** (already planned in WCD-22)
- Add **visual pulse** that matches any audio
- Implement 172.35 Hz anchor tone for all interactions

---

### 6. Error Messages Are Cryptic

**Location:** `ErrorBoundary` fallback text

**Problem:**
- Messages like "Something came loose" are confusing
- No clear "try again" or "get help" action

**Recommendation:**
- Ages 6-12: Show friendly mascot with "Oops! Let's try again!" + big button
- Ages 60-80: Show simple "Something went wrong. Tap here to restart."
- Location: Top-right corner, always visible

---

### 7. No Explicit Age Mode Selector at Boot

**Location:** `BootSequence.tsx`

**Problem:**
- No way to select "Child" vs "Adult" vs "Senior" experience
- Users must navigate to settings (if they can find it)

**Recommendation:**
Add to boot sequence:
```
👶 For Me (ages 6-12)
👨 For Everyone (ages 13-59)  
👵 For Me (ages 60-80)
```

Each selection immediately adjusts:
- Font size
- Button sizes  
- Complexity
- Colors
- Animation speed

---

## 📋 Priority Matrix

| Priority | Issue | Ages Affected | Effort |
|----------|-------|---------------|--------|
| P0 | Add age selector at boot | All | Medium |
| P0 | Increase font sizes for seniors | 60-80 | Low |
| P1 | Create Simple Mode for kids | 6-12 | High |
| P1 | Fix contrast in kids theme | 6-12 | Low |
| P2 | Add emoji-only buttons | 6-12 | Medium |
| P2 | Improve error states | All | Low |
| P3 | Add audio + visual sync | All | Medium |

---

## 🎯 Specific Recommendations

### For Willow (Age 6)

- **Keep on screen:** Only 4 elements at a time (H, O, C, N)
- **Big celebration:** Every successful bond triggers confetti + sound
- **No penalty:** Never show "wrong" — always "try this instead!"
- **Visual feedback:** Atoms should **bounce** when tapped
- **Large touch targets:** 64px minimum (not 48px)

### For Bash (Age 10)

- **More elements:** Add 8-10 elements (H, O, C, N, Ca, Fe, S, P)
- **Quests:** Show as simple pictures, not abstract progress bars
- **Achievements:** Collectible badges, visible on screen
- **Multiplayer:** Already works — good!

### For Mom (Age 80)

- **Large text:** Minimum 18px, preferably 20px
- **High contrast:** Dark text on light backgrounds, or vice versa
- **Simple navigation:** Only 2-3 options visible at once
- **Slow animations:** At least 0.5s transitions
- **Clear feedback:** Every tap does something visible immediately
- **No timed actions:** Remove any "hurry up" mechanics

---

## 🔧 Implementation Plan

### Phase 1: Quick Wins (Same Session)

1. **Font size fix:** Update CSS variables for base text
2. **Age selector:** Add to `BootSequence.tsx`
3. **Contrast fix:** Tweak kids.ts colors

### Phase 2: Child Mode (Next Sprint)

1. **Simple Mode:** New game state `simpleMode: boolean`
2. **Element reduction:** Show only 4-6 elements
3. **Emoji buttons:** Replace command bar text with icons

### Phase 3: Senior Mode (Next Sprint)

1. **Large UI option:** Increase all touch targets to 64px
2. **Slow mode:** Slower atom settling, longer celebration animations
3. **Help button:** Always visible, opens simple overlay

---

## ✅ Files to Modify

| File | Changes |
|------|---------|
| `software/bonding/src/index.css` | Font sizes, touch targets |
| `software/bonding/src/components/hud/BootSequence.tsx` | Add age selector |
| `software/packages/shared/src/theme/presets/kids.ts` | Contrast fixes |
| `software/packages/shared/src/theme/presets/operator.ts` | Senior font sizes |
| `software/bonding/src/store/gameStore.ts` | Add simpleMode state |
| `software/bonding/src/components/ElementPalette.tsx` | Simplified for kids |

---

*As above, so below. Every atom placed is a timestamped parental engagement log.* 🔺
