// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Molecule Soundtrack Engine
//
// Computes musical properties of a molecule: chord, arpeggio,
// and ambient loop pattern.
// ═══════════════════════════════════════════════════════

const ELEMENT_FREQ: Record<string, number> = {
  Ca: 147, Fe: 110, P: 172, Cl: 185, Na: 196, S: 220, N: 247, C: 262, O: 330, H: 523,
};

const CONSONANT_RATIOS = [
  { ratio: 2/1, name: 'octave', score: 1.0 },
  { ratio: 3/2, name: 'perfect fifth', score: 0.9 },
  { ratio: 4/3, name: 'perfect fourth', score: 0.85 },
  { ratio: 5/4, name: 'major third', score: 0.8 },
  { ratio: 6/5, name: 'minor third', score: 0.7 },
  { ratio: 5/3, name: 'major sixth', score: 0.75 },
];

export interface MoleculeChord {
  frequencies: number[];
  rootNote: number;
  intervals: number[];
  consonance: number;
  name: string;
}

export interface MoleculeArpeggio {
  notes: Array<{ frequency: number; element: string; duration: number; delay: number; }>;
  totalDuration: number;
}

export interface AmbientLoop {
  notes: Array<{ frequency: number; startTime: number; duration: number; gain: number; }>;
  loopDuration: number;
  bpm: number;
}

export function getMoleculeChord(elements: string[]): MoleculeChord {
  const freqs = Array.from(new Set(elements.map(el => ELEMENT_FREQ[el]!))).sort((a, b) => a - b);
  const rootNote = freqs[0] || 0;
  const intervals = freqs.slice(1).map((f, i) => f / freqs[i]!);
  return {
    frequencies: freqs,
    rootNote,
    intervals,
    consonance: calculateConsonance(freqs),
    name: getChordName(freqs),
  };
}

export function getMoleculeArpeggio(elements: string[], noteGap = 50): MoleculeArpeggio {
  const uniqueElements = Array.from(new Set(elements));
  const notes = uniqueElements.map((element, i) => ({
    frequency: ELEMENT_FREQ[element]!,
    element,
    duration: 150,
    delay: i * noteGap,
  }));
  const totalDuration = (uniqueElements.length - 1) * noteGap + 150;
  return { notes, totalDuration };
}

export function getAmbientLoop(elements: string[], bpm = 60): AmbientLoop {
  const freqs = Array.from(new Set(elements.map(el => ELEMENT_FREQ[el]!))).sort((a, b) => a - b);
  const loopDuration = (60000 / bpm) * 4;
  const noteDuration = loopDuration / (freqs.length * 2);

  const notes = freqs.map((freq, i) => ({
    frequency: freq,
    startTime: (loopDuration / freqs.length) * i,
    duration: noteDuration,
    gain: i === 0 ? 0.15 : 0.1,
  }));

  return { notes, loopDuration, bpm };
}

export function calculateConsonance(frequencies: number[]): number {
  if (frequencies.length < 2) return 1.0;
  let totalScore = 0;
  let pairs = 0;
  for (let i = 0; i < frequencies.length; i++) {
    for (let j = i + 1; j < frequencies.length; j++) {
      let ratio = frequencies[j]! / frequencies[i]!;
      while (ratio > 2) ratio /= 2; // bring into one octave
      
      const closest = CONSONANT_RATIOS.reduce((prev, curr) => 
          (Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev));
      
      const distance = Math.abs(closest.ratio - ratio);
      // score is higher the closer the distance (max score for distance 0)
      const score = closest.score * (1 - distance / closest.ratio);
      totalScore += score;
      pairs++;
    }
  }
  return pairs > 0 ? totalScore / pairs : 1.0;
}

export function getChordName(frequencies: number[]): string {
    if (frequencies.length === 0) return "Silence";
    if (frequencies.length === 1) return "Unison";
    
    const names: string[] = [];
    for (let i = 1; i < frequencies.length; i++) {
        let ratio = frequencies[i]! / frequencies[0]!;
         while (ratio > 2) ratio /= 2;
        const closest = CONSONANT_RATIOS.reduce((prev, curr) => 
            (Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev));
        names.push(closest.name);
    }
    return names.join(" + ");
}

export function areSameChord(elementsA: string[], elementsB: string[]): boolean {
  const freqsA = Array.from(new Set(elementsA.map(el => ELEMENT_FREQ[el]))).sort();
  const freqsB = Array.from(new Set(elementsB.map(el => ELEMENT_FREQ[el]))).sort();
  return JSON.stringify(freqsA) === JSON.stringify(freqsB);
}
