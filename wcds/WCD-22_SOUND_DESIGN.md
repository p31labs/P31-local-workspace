# WCD-22: SOUND DESIGN — WEB AUDIO FEEDBACK

**Status:** 🟢 POLISH — adds tactile satisfaction, not required for function
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-18-21. Polish pass for March 10.
**Estimated Effort:** 0.5 day
**Passport Reference:** §4 "molecule soundtracks" concept (simplified for ship)

---

## 1. FEATURE DESCRIPTION

Sound makes the game feel alive. Every atom placement, bond formation, molecule completion, and PING reaction gets an audio cue. All sounds are synthesized via Web Audio API — no asset files to load, no network requests, instant playback.

### Sound Events

| Event | Sound | Duration | Notes |
|-------|-------|----------|-------|
| **Atom placed** | Soft tone — pitch varies by element | 150ms | H = high, Cl = low. Each element has a unique note. |
| **Bond formed** | Rising two-note chord | 200ms | Satisfying "click" when atoms connect |
| **Molecule complete (100%)** | Major chord arpeggio | 500ms | Celebratory. Three ascending notes. |
| **Quest step complete** | Molecule complete + extra shimmer | 700ms | Builds on molecule sound |
| **Quest chain complete** | Full ascending scale | 1200ms | The big payoff |
| **Achievement unlocked** | Bright ping + sparkle | 400ms | Distinct from molecule complete |
| **PING received** | Notification blip | 200ms | Gentle — not jarring |
| **LOVE earned** | Coin-like soft chime | 100ms | Subtle, frequent |
| **Error (invalid placement)** | Soft descending buzz | 150ms | Not punishing — informational |
| **Mode switch** | Whoosh / transition | 300ms | Contextual change |

---

## 2. ARCHITECTURE

### Single AudioEngine module

```typescript
// src/audio/audioEngine.ts

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.3; // default 30% — games shouldn't be loud

  /**
   * Must be called on first user interaction (tap/click).
   * Web Audio requires user gesture to start on mobile.
   */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  /**
   * Resume after iOS Safari suspends.
   * Safari suspends AudioContext when the tab is backgrounded.
   */
  private async ensureRunning(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMuted(muted: boolean): void { this.muted = muted; }
  setVolume(volume: number): void { this.volume = Math.max(0, Math.min(1, volume)); }

  async playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    if (this.muted || !this.ctx) return;
    await this.ensureRunning();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Compound sounds built from playTone
  async atomPlaced(element: string): Promise<void> {
    const freq = ELEMENT_FREQUENCIES[element] || 440;
    await this.playTone(freq, 0.15, 'triangle');
  }

  async bondFormed(): Promise<void> {
    await this.playTone(330, 0.1, 'sine');
    setTimeout(() => this.playTone(440, 0.1, 'sine'), 80);
  }

  async moleculeComplete(): Promise<void> {
    const notes = [523, 659, 784]; // C5, E5, G5 — major chord
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => this.playTone(notes[i], 0.2, 'sine'), i * 120);
    }
  }

  async questComplete(): Promise<void> {
    await this.moleculeComplete();
    setTimeout(() => this.playTone(1047, 0.4, 'sine'), 400); // high C octave
  }

  async chainComplete(): Promise<void> {
    const scale = [523, 587, 659, 698, 784, 880, 988, 1047]; // C major scale
    for (let i = 0; i < scale.length; i++) {
      setTimeout(() => this.playTone(scale[i], 0.15, 'sine'), i * 100);
    }
  }

  async pingReceived(): Promise<void> {
    await this.playTone(880, 0.1, 'sine');
    setTimeout(() => this.playTone(1100, 0.1, 'sine'), 60);
  }

  async loveEarned(): Promise<void> {
    await this.playTone(1200, 0.08, 'triangle');
  }

  async error(): Promise<void> {
    await this.playTone(200, 0.15, 'sawtooth');
  }
}

export const audioEngine = new AudioEngine();
```

### Element → Frequency Mapping

Each element gets a unique musical note. This is the embryonic form of the "molecule soundtracks" concept from the Passport.

```typescript
// Chromatic scale starting at middle C
// Ordered roughly by atomic number
const ELEMENT_FREQUENCIES: Record<string, number> = {
  'H':  523.25,  // C5
  'C':  587.33,  // D5
  'N':  659.25,  // E5
  'O':  698.46,  // F5
  'Na': 783.99,  // G5
  'P':  880.00,  // A5
  'S':  932.33,  // Bb5
  'Cl': 987.77,  // B5
  'K':  1046.50, // C6
  'Ca': 1108.73, // Db6
  'Fe': 1174.66, // D6
  'Mn': 1244.51, // Eb6
};
```

**The implication:** H₂O is C-C-F (two hydrogens, one oxygen). NaCl is G-B. Each molecule has a "sound." This plants the seed for future development where molecules literally play chords.

---

## 3. INITIALIZATION: USER GESTURE REQUIREMENT

Mobile browsers require a user interaction before AudioContext can play. Initialize the engine on the FIRST tap anywhere in the game:

```typescript
// In App.tsx or CockpitLayout.tsx
useEffect(() => {
  const initAudio = () => {
    audioEngine.init();
    document.removeEventListener('pointerdown', initAudio);
  };
  document.addEventListener('pointerdown', initAudio);
  return () => document.removeEventListener('pointerdown', initAudio);
}, []);
```

This is a one-time setup. After the first tap (which will be the mode select card), all subsequent sounds play instantly.

---

## 4. INTEGRATION POINTS

Wire the audio engine to existing game events. Do NOT modify game logic — just add `audioEngine.xyz()` calls alongside existing handlers.

| Where | Trigger | Sound |
|-------|---------|-------|
| Atom drag handler (on drop) | Atom placed on canvas | `audioEngine.atomPlaced(element.symbol)` |
| Bond creation logic | Two atoms connect | `audioEngine.bondFormed()` |
| Stability reaches 100% | Molecule matched | `audioEngine.moleculeComplete()` |
| Quest step completion (WCD-21) | Quest advances | `audioEngine.questComplete()` |
| Quest chain completion (WCD-21) | Full quest done | `audioEngine.chainComplete()` |
| Achievement unlock handler | Achievement fires | `audioEngine.moleculeComplete()` (reuse) |
| PING received handler (WCD-13) | Incoming ping | `audioEngine.pingReceived()` |
| LOVE added handler | LOVE increments | `audioEngine.loveEarned()` |
| Invalid atom placement | Atom rejected | `audioEngine.error()` |
| Mode switch | Mode changes | Short whoosh (optional) |

---

## 5. MUTE TOGGLE

Add a mute button to the HUD. Speaker icon (🔊/🔇) in the top bar alongside existing icons.

```typescript
// In TopBar.tsx
const [muted, setMuted] = useState(false);

const toggleMute = () => {
  const newMuted = !muted;
  setMuted(newMuted);
  audioEngine.setMuted(newMuted);
};

// Render
<button onClick={toggleMute} className="hud-icon">
  {muted ? '🔇' : '🔊'}
</button>
```

**Default: unmuted at 30% volume.** Games should have sound by default — it's part of the experience. But the mute button must be easily accessible (48px touch target) because: classrooms, public transit, sleeping siblings.

Mute state should persist in localStorage (or the game store's IndexedDB persistence) so it survives page refreshes.

---

## 6. FILE MANIFEST

Files you WILL create:

| File | Purpose |
|------|---------|
| `src/audio/audioEngine.ts` | AudioEngine class + element frequency map |

Files you WILL modify:

| File | Action |
|------|--------|
| `src/App.tsx` or `src/components/CockpitLayout.tsx` | Add pointerdown listener for audio init |
| `src/components/TopBar.tsx` | Add mute toggle button |
| Atom placement handler | Add `audioEngine.atomPlaced()` call |
| Bond creation handler | Add `audioEngine.bondFormed()` call |
| Molecule completion handler | Add `audioEngine.moleculeComplete()` call |
| LOVE addition handler | Add `audioEngine.loveEarned()` call |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Audio is a side effect, not game logic |
| `src/telemetry/*` | Audio doesn't generate telemetry events |
| `worker-telemetry.ts` | Worker doesn't make sounds |

---

## 7. VERIFICATION CHECKLIST

- [ ] **Audio init:** No sound plays before first user tap (no autoplay violation)
- [ ] **Atom placed:** Tone plays on atom drop, pitch varies by element
- [ ] **H vs Cl:** Audibly different tones
- [ ] **Bond formed:** Two-note ascending chord on bond creation
- [ ] **Molecule complete:** Three-note major chord arpeggio at 100% stability
- [ ] **Mute button visible:** 🔊/🔇 icon in top bar, 48px touch target
- [ ] **Mute works:** Toggle stops all sound; toggle again resumes
- [ ] **Mute persists:** Refresh page, mute state remembered
- [ ] **Safari iOS:** Audio plays after first tap (AudioContext resumed)
- [ ] **Volume reasonable:** Default 30%, not jarring
- [ ] **No audio errors in console:** No "AudioContext not allowed" warnings
- [ ] **Multiple rapid sounds:** Fast atom placement doesn't crash or clip
- [ ] **Vitest:** All existing tests pass (audio doesn't break headless tests)
- [ ] **Build clean:** `npm run build` — zero errors

---

## 8. SCOPE BOUNDARY

**IN SCOPE:** Basic synthesized tones for game events. Mute toggle.

**OUT OF SCOPE:**
- Molecule "chords" (future: H₂O plays a C-C-F chord simultaneously)
- Background ambient music
- Spatial audio (sound position based on atom location)
- Audio file assets (MP3/WAV/OGG)
- Volume slider (mute toggle is sufficient for launch)
- Per-sound volume balancing (use uniform volume for now)

The Passport describes molecule soundtracks, breathing room audio, and compositional chemistry. All of that is post-birthday. This WCD is: atoms make sounds. Molecules celebrate. Mute works.

---

*WCD-22 — Opus — March 2, 2026*
*"Every element has a note. Every molecule is a chord. H₂O sounds like life."*
