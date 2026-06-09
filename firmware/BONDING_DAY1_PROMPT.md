# BONDING — Day 1 Build Prompt
# Drop this into Gemini CLI, Roo Code (Build mode), or Cline
# Target: Atoms render. Sound plays. Chemistry works.

Read BONDING_MANUFACTURING_ORDER.md for the full spec. This is Day 1.

## Task: Scaffold BONDING and get the first atom glowing with sound

### Step 1: Create the project
```
cd ~/Documents/P31_Andromeda/software
mkdir bonding && cd bonding
npm create vite@latest . -- --template react-ts
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Create these files in order

**src/data/elements.ts**
Define the 6 elements. Each element has:
- symbol: 'H' | 'C' | 'O' | 'Na' | 'P' | 'Ca'
- name: string
- valence: number (H=1, C=4, O=2, Na=1, P=3, Ca=2)
- color: hex string (H='#E8F4FD', C='#2D5016', O='#8B1A1A', Na='#DAA520', P='#7B2FF7', Ca='#C0C0C0')
- emissive: hex string (brighter version of color for glow)
- frequency: number (H=523, C=262, O=330, Na=196, P=172, Ca=147)
- note: string label (H='C5', C='C4', O='E4', Na='G3', P='F3', Ca='D3')
- size: number (H=0.3, C=0.5, O=0.5, Na=0.5, P=0.5, Ca=0.6)

Export as a Record<ElementSymbol, ElementData> and as an array.

**src/engine/chemistry.ts**
Pure functions, no React:
- canBond(atom: PlacedAtom, atoms: PlacedAtom[]): boolean — checks if atom has unfilled bond sites
- getAvailableBondSites(atom: PlacedAtom): number — valence minus current bonds count
- calculateStability(atoms: PlacedAtom[]): number — filled bonds / total possible bonds (0-1)
- generateFormula(atoms: PlacedAtom[]): string — produces "H₂O", "CH₄", etc. with subscripts
- isMoleculeComplete(atoms: PlacedAtom[]): boolean — all atoms have all valences satisfied
- generateBondSitePositions(atom: PlacedAtom): Vector3[] — returns 3D positions for ghost sites around an atom based on its valence (tetrahedral for 4, linear for 1, bent for 2, trigonal for 3)

**src/engine/sound.ts**
Web Audio API synthesis, no audio files:
- createAudioContext(): AudioContext — lazy init on first user gesture
- playAtomNote(frequency: number): void — triangle wave, 200ms attack, 500ms decay, slight detune +2 cents
- playBondInterval(freq1: number, freq2: number): void — both notes, staggered 50ms, sine + triangle
- playCompletionChord(frequencies: number[]): void — all notes sustained 2s, filter sweep, then 863Hz Larmor fade-in
- playPing(): void — quick ascending chirp
- playReject(): void — low buzz, 50ms

**src/types.ts**
All TypeScript interfaces from the manufacturing order: PlacedAtom, Bond, BondingGame, Player, PingEvent, EngagementEvent, ElementSymbol, ElementData.

**src/components/VoxelAtom.tsx**
React Three Fiber component:
- RoundedBox geometry (from drei) sized by element.size
- MeshStandardMaterial with element.color and element.emissive
- emissiveIntensity animated (gentle pulse using useFrame, oscillate between 0.3 and 0.8)
- Bloom glow comes from the postprocessing setup in the canvas
- On click: play the atom's note via sound.ts
- Props: element, position, onClick, isHighlighted (for ping glow)

**src/components/MoleculeCanvas.tsx**
The 3D scene:
- Canvas from @react-three/fiber
- EffectComposer + Bloom from @react-three/postprocessing (intensity 1.5, luminanceThreshold 0.2)
- OrbitControls from drei (enablePan false, touch friendly)
- Ambient light (low, 0.1) + point light (warm white, follows camera slightly)
- Background color #0a0a1a
- Stars from drei (subtle, small, background layer)
- Render one carbon atom at origin as proof of life
- Auto-rotate when no interaction (speed 0.5)

**src/App.tsx**
Minimal for Day 1:
- Full screen MoleculeCanvas
- One carbon atom rendered
- Click the atom → hear C4 (262 Hz)
- Element palette at bottom (just visual for now, no placement logic yet)
- Tailwind dark theme

### Step 3: Verify
Run `npm run dev`. You should see:
- Dark space background with subtle stars
- One glowing green voxel cube (carbon) slowly rotating
- Click it → hear a warm C4 tone
- Bloom glow around the atom
- Element palette strip at the bottom of the screen

That's Day 1 done. A single glowing atom that sings when you touch it.

### Important Notes
- Use TypeScript strict mode
- All interactive elements need cursor: pointer
- Touch events must work (this will be played on phones/tablets)
- AudioContext must be created on first user gesture (click/tap), not on mount
- No localStorage — we'll use window.storage API for multiplayer later
- Keep all game logic in engine/ as pure functions, separate from React components
