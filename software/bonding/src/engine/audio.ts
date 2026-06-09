// Molecule Soundtracks — Chromatic notes for elements, chords for molecules
// Web Audio API implementation for completion sounds

const elementNotes: Record<string, number> = {
  bashium: 261.63,     // C4
  willium: 329.63,     // E4
  missing_node: 392.00, // G4
  tetrahedron: 493.88   // B4
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playNote(frequency: number, duration: number = 0.5, delay: number = 0): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration);
}

export function playElementSound(elementId: string): void {
  const frequency = elementNotes[elementId];
  if (frequency) {
    playNote(frequency);
  }
}

export function playMoleculeChord(elementIds: string[]): void {
  elementIds.forEach((id, index) => {
    const frequency = elementNotes[id];
    if (frequency) {
      playNote(frequency, 1.0, index * 0.1); // Stagger notes for chord
    }
  });
}