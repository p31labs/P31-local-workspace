# WCD BATCH 2 — PARALLEL
## Track A: Ship | Track C: Court
## Route simultaneously. No waiting.

---

## TRACK A — SHIP

### WCD-39: Deploy to Cloudflare Pages
**Agent:** CC  
**Branch:** `main`

**Deliverables:**
1. Push `dist/` to Cloudflare Pages at p31ca.org
2. Verify HTTPS certificate active
3. Verify service worker registers on first visit
4. Verify precache manifest loads (1.4MB confirmed in WCD-38)
5. Verify "Add to Home Screen" prompt appears on Android Chrome
6. Verify offline: load page → airplane mode → reload → game still works
7. Verify multiplayer relay still live at bonding-relay.trimtab-signal.workers.dev

**Exit criteria:** p31ca.org loads BONDING on a phone browser. PWA installable. Offline works.

---

### WCD-40: Android Tablet Device Test
**Agent:** Will (hands-on, not code)  
**Devices:** 2× Android tablets + Will's device

**Test script — run every item, note pass/fail:**

**Seed Mode (Willow flow):**
- [ ] Launch → mode select → tap Seed 🌱
- [ ] Tutorial fires (Willow's First Molecule, 9 steps)
- [ ] Tutorial highlights visible and tappable at arm's length
- [ ] Build H₂O start to finish — atoms snap, bond forms, stability hits 100%
- [ ] Completion overlay shows personality + molecule fun fact
- [ ] Element fun fact toast fires on first H placement
- [ ] LOVE counter increments
- [ ] Achievement unlocks (first_bond, water_world, etc.)
- [ ] Sound plays on bond formation + completion chord
- [ ] No accidental zoom on double-tap
- [ ] No pull-to-refresh on drag
- [ ] No address bar pop on scroll
- [ ] No edge-swipe triggering Android back
- [ ] Landscape holds on device tilt

**Sprout Mode (Bash flow):**
- [ ] Launch → mode select → tap Sprout 🌿
- [ ] Quest selector shows Genesis + The Kitchen
- [ ] Build CH₄ — carbon bonds to 4 hydrogens, tetrahedral geometry
- [ ] Build CO₂ — linear geometry, double bonds display
- [ ] displayFormula shows "CO₂" not "CO₂" with wrong subscripts
- [ ] 4-tier fun facts fire at sprout/bash level (not willow level)

**Multiplayer:**
- [ ] Device A: create room → 6-char code displayed + QR code
- [ ] Device B: join room → enter code → connected
- [ ] Device A builds H₂O → Device B sees formula update
- [ ] Device B sends 💚 ping → Device A receives it
- [ ] Device A sends 🔺 ping → Device B receives it
- [ ] Both devices complete same molecule → both get LOVE

**Audio:**
- [ ] Web Audio plays after first user interaction (Android gesture requirement)
- [ ] Completion chord audible on tablet speakers
- [ ] Volume reasonable (not blasting, not inaudible)

**Haptic:**
- [ ] Bond snap vibrates
- [ ] Completion vibrates
- [ ] Haptic toggle works (off = no vibration)

**PWA:**
- [ ] "Add to Home Screen" → icon on home screen
- [ ] Launch from home screen → fullscreen, no browser chrome
- [ ] Kill app → relaunch → state preserved

**Bugs found (log here):**
- [ ] ...

---

### WCD-41: Tyler Multiplayer Stress Test
**Agent:** Will + Tyler  
**Networks:** Different WiFi/cellular

**Test script:**
- [ ] Room creation from Will's device
- [ ] Tyler joins via code (not QR — test code entry)
- [ ] Extended session: 10+ molecules built
- [ ] Ping exchange: 20+ pings total, verify all received
- [ ] Latency: any perceptible delay on formula broadcast? (note seconds)
- [ ] Network drop: Tyler toggles airplane mode 5 seconds → reconnect → state syncs
- [ ] KV write budget: calculate total writes in session vs 1,000/day free limit
- [ ] Simultaneous completion: both complete H₂O at same moment → both get credit?
- [ ] Room code reuse: close room, create new room → old code doesn't collide

**Stress metrics to record:**
- Total session duration: ___
- Total molecules built (combined): ___
- Total pings sent: ___
- Total KV writes (check Cloudflare dashboard): ___
- Errors observed: ___

---

## TRACK C — COURT

### WCD-42: Updated Exhibit A System Description
**Agent:** Opus  
**Output:** Word document (.docx)

**Update Section 1 (What BONDING Is):**
- "...containing 10 chemical elements and over 60 known molecules"
- "...with three difficulty levels designed for different ages"

**Update Section 2 (How It Works):**
- Add: "The game includes guided tutorials for first-time players"
- Add: "Players receive educational facts about each element and molecule as they build"
- Add: "Touch controls are designed for children as young as six, with large targets and simplified interactions"

**Update Section 3 (What It Teaches):**
- Reference NGSS alignment (already in separate doc, but mention: "aligned with Next Generation Science Standards for grades K-8")

**Update Section 5 (Who Built It and Why):**
- "The game was built by a father for his children's birthdays"
- "Development began on February 25, 2026, and the game was completed and deployed on [deploy date]"
- "The game has been tested with [X] automated quality checks to ensure it works reliably" (use 470)

**Update Section 7 (What the Data Shows):**
- Leave as template until March 10 real data fills it
- Add header text: "This section will be updated with actual engagement data from sessions beginning March 10, 2026"

**Zero jargon. 8th grade reading level. Same tone as v1.**

---

### WCD-43: Updated GAL Briefing Memo
**Agent:** Opus  
**Output:** Word document (.docx)

**Updates:**
- Paragraph 2: mention three difficulty modes by name (Seed for Willow, Sprout for Bash)
- Paragraph 3: "...aligned with 6 Next Generation Science Standards spanning grades K-8"
- Paragraph 4: "The game has passed 470 automated quality checks and has been tested on the same tablet devices the children will use"
- Paragraph 7 (the ask): unchanged — "I respectfully request the opportunity to use BONDING with my children during scheduled contact, either in person or remotely on separate devices."

**One page. Professional. No pleading.**

---

### WCD-44: Updated NGSS Alignment
**Agent:** Opus  
**Output:** Word document (.docx)

**Updates:**
- Add difficulty mode mapping: which standards map to Seed (K-2), which to Sprout (3-5), which to Sapling (6-8)
- Add: "Willow (age 6) will engage primarily with standards 2-PS1-1 and 2-PS1-2 through the Seed difficulty mode"
- Add: "Sebastian (age 9, turning 10) will engage with standards 5-PS1-1, MS-PS1-1, and MS-PS1-2 through the Sprout difficulty mode"
- Keep existing standard citations and crosscutting concepts

---

### WCD-45: Engagement Report Template (Ready for Real Data)
**Agent:** Opus  
**Output:** Word document (.docx)

**Replace sample data with template fields:**
```
Session Date: [DATE]
Participants: William R. Johnson, [CHILD NAME(S)]
Mode: [Seed/Sprout/Sapling]
Duration: [X] minutes
Molecules Built: [LIST]
Pings Exchanged: [COUNT]
Achievements Unlocked: [LIST]
```

**Keep the narrative format from v1** (generateCourtSummary() output) but make it a fillable template that Will populates after each real session.

**Add instruction header** (for Will's reference only, remove before filing):
"After each play session, export Exhibit A data from the game menu. Copy the session summary into the appropriate date section below. Print and file."

---

## ROUTING

| WCD | Agent | Track | Blocks on |
|-----|-------|-------|-----------|
| 39 | CC | A | Nothing — go now |
| 40 | Will | A | WCD-39 (need live URL) |
| 41 | Will + Tyler | A | WCD-40 (need device test first) |
| 42 | Opus | C | Nothing — go now |
| 43 | Opus | C | Nothing — go now |
| 44 | Opus | C | Nothing — go now |
| 45 | Opus | C | Nothing — go now |

**WCD-39 and WCD-42-45 fire simultaneously.** CC deploys while Opus builds court docs. No waiting.

---

*Track A ships the game. Track C ships the evidence. Same clock. Parallel paths. Always.*
