# BONDING — Day 2 Build Prompt
# Target: Full single-player placement loop. Build H₂O. Hear the chord.

Read BONDING_MANUFACTURING_ORDER.md for the full spec. Read the Day 1 files already created in software/bonding/src/ to understand existing code.

## What Exists (Day 1 — Done)
- elements.ts — 6 elements with all properties
- chemistry.ts — valence rules, bond validation, stability calc, formula generation, bond site positions
- sound.ts — Web Audio synthesis (atom notes, bond intervals, completion chord, ping, reject)
- types.ts — all TypeScript interfaces
- VoxelAtom.tsx — glowing rounded box with pulse animation, click-to-play-note
- MoleculeCanvas.tsx — Three.js scene with bloom, orbit controls, stars
- App.tsx — renders one carbon atom with element palette strip

## Day 2 Goal
A player can:
1. Select an element from the palette
2. See available bond sites (ghost cubes) on existing atoms
3. Click a bond site to place a new atom
4. See the bond beam connect them
5. Hear the bond interval
6. Watch stability meter climb
7. Complete a molecule (all valences satisfied)
8. Hear the completion chord + see formula display

By end of Day 2, you should be able to build H₂O (place O at center, add two H atoms) and hear the three-note chord when it completes.

## Files to Create / Modify

### NEW: src/engine/haptic.ts
Haptic feedback via navigator.vibrate API. All calls wrapped in try/catch. Export a `haptic` object with methods: goodBond(), badBond(), place(), snap(), complete(), ping(). Pattern definitions are in the Drag and Drop section above. This is a small file — just the object with 6 methods.

### NEW: src/components/GhostSite.tsx
Ghost bond site indicator — shows where atoms CAN be placed.
- Small translucent RoundedBox (size 0.2, opacity 0.3)
- Slow pulse animation (opacity oscillates 0.15 to 0.4)
- Color matches the currently selected element (so player sees preview)
- On click/tap: triggers atom placement at this position
- Only visible when an element is selected in the palette
- Position calculated by chemistry.ts generateBondSitePositions()
- Use @react-three/drei's Html component for a small "+" label if needed for clarity

### NEW: src/components/BondBeam.tsx
Visual connection between bonded atoms.
- Cylinder geometry between two atom positions
- Radius: 0.04
- Material: MeshStandardMaterial with emissive glow
- Color: blend of the two connected element colors (average the RGB)
- Emissive intensity: 0.5 (steady, not pulsing)
- Calculate position as midpoint, rotation via lookAt, length via distance

### NEW: src/components/ElementPalette.tsx
Bottom strip for element selection. Replace the existing static palette in App.tsx.
- Horizontal row of 6 element buttons
- Each button: element symbol + name + remaining bond count indicator
- Selected element has a bright border/glow
- Clicking an element selects it (or deselects if already selected)
- Display current element info: name, valence, frequency
- Use Tailwind for styling: fixed bottom, dark glass background, rounded
- Touch-friendly: minimum 44px tap targets

### NEW: src/components/StabilityMeter.tsx
Shows molecule completion progress.
- Horizontal bar at the top of the screen
- Fill percentage = chemistry.calculateStability(atoms)
- Color gradient: red (0%) → yellow (50%) → green (100%)
- Shows current formula (from chemistry.generateFormula) next to the bar
- When 100%: flash animation, then trigger completion sequence
- Use Tailwind: fixed top, glass background

### NEW: src/store/gameStore.ts
Zustand store for single-player game state:
```typescript
interface GameStore {
  // State
  atoms: PlacedAtom[];
  bonds: Bond[];
  selectedElement: ElementSymbol | null;
  nextAtomId: number;
  gamePhase: 'placing' | 'complete';
  
  // Actions
  selectElement: (symbol: ElementSymbol | null) => void;
  placeAtom: (element: ElementSymbol, position: Vector3, bondToAtomId: number) => void;
  reset: () => void;
}
```

When placeAtom is called:
1. Create new PlacedAtom at the given position
2. Create Bond between new atom and bondToAtomId
3. Update bondedTo arrays on both atoms
4. Play bond interval sound (both element frequencies)
5. Check if molecule is complete → if yes, set gamePhase to 'complete', play completion chord
6. Increment nextAtomId
7. Deselect element (force player to consciously pick next one)

### MODIFY: src/components/MoleculeCanvas.tsx
Update to render the full game scene:
- Render all atoms from gameStore.atoms (not just a hardcoded carbon)
- Render BondBeam for each bond in gameStore.bonds
- Render GhostSite components on all available bond sites of all atoms with unfilled valences
- Only show GhostSites when an element is selected
- On GhostSite click: call gameStore.placeAtom with the selected element, ghost position, and parent atom ID
- If no atoms exist yet, render a single GhostSite at origin (first placement)
- On molecule complete: disable further placement, trigger celebration

### MODIFY: src/App.tsx
- Replace hardcoded carbon with the MoleculeCanvas reading from gameStore
- Add ElementPalette component
- Add StabilityMeter component
- Add a "New Molecule" button that calls gameStore.reset (appears after completion or in corner)
- Add molecule completion overlay: formula display, "🎉 Complete!" text, personality hint

## Interaction: DRAG AND DROP + HAPTIC

This is NOT click-to-select, click-to-place. It's **pick up and put down.** The atom should feel like it has weight.

### Drag-and-Drop Flow

1. Game starts with no atoms. A single ghost site pulses at origin.
2. Player **long-presses or taps** an element in the palette → it "lifts" (scale up, shadow appears)
3. Player **drags** the element upward into the 3D canvas
4. While dragging: a translucent preview atom follows the pointer/finger via raycasting onto a plane
5. Ghost bond sites on existing atoms **activate** — they grow and glow brighter as the dragged atom approaches
6. **Snap zone**: When the dragged atom is within 1.0 unit of a valid bond site:
   - Ghost site LOCKS — grows to full size, turns solid, bright pulse
   - Preview atom snaps to the bond site position (magnetic pull, ease tween ~100ms)
   - **HAPTIC: Good bond** — single short vibration (navigator.vibrate(40))
   - The bond interval preview plays quietly (30% volume)
7. If dragged atom is near an atom with NO available sites:
   - **HAPTIC: Bad bond** — double buzz (navigator.vibrate([20, 30, 20]))
   - Ghost site flashes red briefly
   - Reject sound plays (quiet)
   - Preview atom does NOT snap
8. Player **releases** (pointerup / touchend):
   - If snapped to valid site → atom PLACES with full sound + haptic confirmation (navigator.vibrate(60))
   - If NOT snapped → atom flies back to palette (spring animation) with a soft "whoosh"
9. Bond beam animates in (grows from center outward, 200ms)
10. Stability meter updates
11. Ghost sites recalculate for all atoms

### Palette Behavior During Drag
- The dragged element "leaves" the palette (its slot dims/empties)
- Other elements remain available but slightly dimmed
- If dropped back onto palette area (below the canvas), it cancels — element returns to slot
- After successful placement, all palette elements re-brighten for next pick

### First Atom Placement (No Existing Atoms)
- Drag from palette into the canvas
- A "landing zone" ghost pulses at origin
- Snap to origin when within range
- Drop → first atom places at center
- No bond formed (it's alone), just the placement note + haptic

### Mobile Touch Specifics
- Use pointer events (onPointerDown, onPointerMove, onPointerUp) for unified mouse/touch
- For the 3D drag: cast a ray from the pointer onto an invisible plane at z=0 (or the molecule's center plane)
- The dragged preview atom should be slightly transparent (opacity 0.6) until it snaps
- On snap: preview goes full opacity
- Minimum drag distance of 20px before initiating drag (prevents accidental drags from taps)
- When finger is over the 3D canvas, disable orbit controls (so dragging an atom doesn't rotate the view)

### Haptic Feedback (navigator.vibrate API)
All haptic is optional — wrap in try/catch, check for API support.

```typescript
const haptic = {
  goodBond: () => {
    try { navigator.vibrate(40); } catch {}
  },
  badBond: () => {
    try { navigator.vibrate([20, 30, 20]); } catch {}
  },
  place: () => {
    try { navigator.vibrate(60); } catch {}
  },
  snap: () => {
    try { navigator.vibrate(15); } catch {}
  },
  complete: () => {
    try { navigator.vibrate([50, 50, 50, 50, 100]); } catch {}
  },
  ping: () => {
    try { navigator.vibrate([30, 40, 30]); } catch {}
  }
};
```

Put this in a new file: **src/engine/haptic.ts**

### Component Changes for Drag-and-Drop

**NEW: src/components/DragPreview.tsx**
- A translucent VoxelAtom that follows the pointer during drag
- Rendered in the Three.js scene via raycasting pointer position onto a plane
- Shows snap state: translucent when floating, solid when snapped to a valid site
- Spring animation back to palette on cancel (use simple lerp in useFrame)

**MODIFY: src/components/ElementPalette.tsx**
- Each element is a draggable item
- onPointerDown starts the drag (set dragging state in store)
- While dragging, the palette element dims and a DragPreview appears in the canvas
- The palette sits in the HTML layer (not Three.js), so the drag transitions from HTML → Three.js
- Approach: on pointerdown, set `store.dragging = { element, startPos }`. The MoleculeCanvas reads this and renders DragPreview. On pointerup anywhere, either place or cancel.

**MODIFY: src/components/GhostSite.tsx**
- Add proximity detection: ghost site knows when DragPreview is nearby
- Grow animation when drag preview enters snap range (scale 1.0 → 1.4, 100ms ease)
- Color shifts to match dragged element on snap
- Shrink back when drag leaves range

**MODIFY: src/store/gameStore.ts**
Add drag state:
```typescript
interface GameStore {
  // ... existing state
  dragging: { element: ElementSymbol; pointerPos: Vector3 } | null;
  snappedSite: { atomId: number; siteIndex: number; position: Vector3 } | null;
  
  // ... existing actions
  startDrag: (element: ElementSymbol) => void;
  updateDragPosition: (pos: Vector3) => void;
  snapToSite: (atomId: number, siteIndex: number, position: Vector3) => void;
  unsnapFromSite: () => void;
  endDrag: () => void;  // places if snapped, cancels if not
}
```

## Bond Site Position Logic

The chemistry.ts generateBondSitePositions function should return positions relative to the atom center. Make sure these are in WORLD SPACE when rendering (atom.position + relative offset). Site positions by valence:

- Valence 1: one site directly "outward" from the atom (away from its bonded partner, or +y if first atom)
- Valence 2: two sites at ~104.5° angle (water-like bent geometry) 
- Valence 3: trigonal planar (120° apart in a plane)
- Valence 4: tetrahedral (109.5° apart in 3D)

For sites that are already bonded, skip that position. Only render ghost sites for UNFILLED positions.

Important: bond site positions should avoid overlapping with existing atoms. Use a simple collision check — if a proposed ghost site position is within 0.5 units of any existing atom, nudge it outward.

## Sound + Haptic Triggers (Combined)

Every significant action has BOTH a sound AND a haptic response. The body and the ears confirm together.

| Action | Sound | Haptic |
|--------|-------|--------|
| Drag starts (lift from palette) | Quiet blip of element note (50ms, 20% vol) | haptic.snap (15ms) |
| Drag enters snap zone | Bond interval preview (30% vol) | haptic.goodBond (40ms) |
| Drag near invalid site | playReject() quiet | haptic.badBond (double buzz) |
| Drop → atom places | playAtomNote + playBondInterval (full vol) | haptic.place (60ms) |
| Drop → cancelled (no snap) | Soft whoosh (white noise burst, 100ms) | none |
| Molecule complete | playCompletionChord (all freqs + 863Hz Larmor) | haptic.complete (pattern burst) |
| Ping sent | playPing() | haptic.ping (triple tap) |

## Verification
Run `npm run dev`. On a phone or desktop you should be able to:
1. Long-press/click Oxygen in the palette → it lifts
2. Drag it up into the 3D canvas → translucent preview follows your finger
3. Drag over the origin landing zone → it SNAPS, goes solid, phone buzzes (40ms)
4. Release → atom places at center, O note plays, phone buzzes confirmation (60ms)
5. Two ghost bond sites appear around the oxygen
6. Drag Hydrogen from palette toward a ghost site
7. Feel the snap when you enter the zone, hear the quiet O+H preview
8. Release → H places, bond beam grows in, bond interval rings
9. Drag another H to the other ghost site → same snap + place
10. All valences satisfied → completion chord plays, phone buzzes the pattern, "H₂O" displays
11. The molecule glows brighter

Test on phone: the drag should feel PHYSICAL. The snap should feel MAGNETIC. The haptic should feel like the atom clicked into place.

That's Day 2. Drag-and-drop molecule building with haptic confirmation.

## Important Notes
- Keep all game logic in the zustand store and engine/ functions — components just render
- Touch events must work (onPointerDown, not just onClick)
- Don't break the bloom/glow from Day 1
- AudioContext is already lazy-initialized from Day 1 — just use the existing sound.ts functions
- TypeScript strict — no any types
- If Three.js geometry needs disposing on unmount, handle it in useEffect cleanup
