// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Molecule Soundtrack Engine tests
//
// Pure unit tests. No Web Audio API calls.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getMoleculeChord,
  getMoleculeArpeggio,
  getAmbientLoop,
  calculateConsonance,
  getChordName,
  areSameChord,
} from './soundtrack';

describe('Molecule Soundtrack Engine', () => {
  it('getMoleculeChord returns sorted frequencies', () => {
    const chord = getMoleculeChord(['H', 'O', 'C']);
    expect(chord.frequencies).toEqual([262, 330, 523]);
  });

  it('getMoleculeChord deduplicates (H₂ has one freq, not two)', () => {
    const chord = getMoleculeChord(['H', 'H']);
    expect(chord.frequencies).toEqual([523]);
  });

  it('getMoleculeChord H₂O has 2 unique frequencies [330, 523]', () => {
    const chord = getMoleculeChord(['H', 'H', 'O']);
    expect(chord.frequencies).toEqual([330, 523]);
  });

  it('getMoleculeChord CaO has 2 unique frequencies [147, 330]', () => {
    const chord = getMoleculeChord(['Ca', 'O']);
    expect(chord.frequencies).toEqual([147, 330]);
  });

  it('getMoleculeArpeggio note count matches unique elements', () => {
    const arpeggio = getMoleculeArpeggio(['H', 'H', 'O']);
    expect(arpeggio.notes.length).toBe(2);
  });

  it('getMoleculeArpeggio delays are sequential', () => {
    const arpeggio = getMoleculeArpeggio(['C', 'O', 'H']);
    expect(arpeggio.notes[0]?.delay).toBe(0);
    expect(arpeggio.notes[1]?.delay).toBe(50);
    expect(arpeggio.notes[2]?.delay).toBe(100);
  });

  it('getMoleculeArpeggio respects noteGap parameter', () => {
    const arpeggio = getMoleculeArpeggio(['C', 'O', 'H'], 100);
    expect(arpeggio.notes[1]?.delay).toBe(100);
    expect(arpeggio.notes[2]?.delay).toBe(200);
  });

  it('getAmbientLoop loopDuration matches bpm', () => {
    const loop = getAmbientLoop(['C'], 120);
    expect(loop.loopDuration).toBe(2000); // 60000 / 120 * 4
  });

  it('getAmbientLoop all notes fit within loop duration', () => {
    const loop = getAmbientLoop(['C', 'O', 'H']);
    for (const note of loop.notes) {
      expect(note.startTime + note.duration).toBeLessThanOrEqual(loop.loopDuration);
    }
  });

  it('getAmbientLoop gain values are ≤ 0.15', () => {
    const loop = getAmbientLoop(['C', 'O', 'H']);
    for (const note of loop.notes) {
      expect(note.gain).toBeLessThanOrEqual(0.15);
    }
    expect(loop.notes[0]?.gain).toBe(0.15);
  });

  it('calculateConsonance returns 1.0 for octave (H + low H)', () => {
    // We don't have a lower H, so let's simulate with C4 and C5
    const consonance = calculateConsonance([262, 523]); // C4, C5 (almost perfect octave)
    expect(consonance).toBeGreaterThan(0.99);
  });

  it('calculateConsonance returns high value for O+H (close to 5:3)', () => {
    // H/O = 523/330 = 1.58, close to 1.66 (major sixth)
    const consonance = calculateConsonance([330, 523]);
    expect(consonance).toBeGreaterThan(0.7);
  });

  it('calculateConsonance returns value between 0 and 1', () => {
    const consonance = calculateConsonance([110, 185, 262, 330, 523]);
    expect(consonance).toBeGreaterThanOrEqual(0);
    expect(consonance).toBeLessThanOrEqual(1);
  });
  
  it('getChordName identifies major sixth', () => {
    const name = getChordName([330, 523]);
    expect(name).toContain('major sixth');
  });

  it('areSameChord returns true for H₂O and H₂O (same elements)', () => {
    expect(areSameChord(['H', 'H', 'O'], ['O', 'H', 'H'])).toBe(true);
  });

  it('areSameChord returns false for H₂O and CO₂', () => {
    expect(areSameChord(['H', 'H', 'O'], ['C', 'O', 'O'])).toBe(false);
  });
});
