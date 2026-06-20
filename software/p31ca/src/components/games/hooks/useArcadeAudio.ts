import useAudio from '../../../lib/arcade-core/useAudio.js';

export function useArcadeAudio() {
  const audio = useAudio();

  return {
    playTap: () => audio.playNote('C5', 'triangle', 0.1),
    playSuccess: () => {
      audio.playNote('E5', 'triangle', 0.08);
      audio.playNote('G5', 'triangle', 0.12);
    },
    playError: () => {
      audio.playNote('C4', 'sawtooth', 0.15);
      audio.playNote('B3', 'sawtooth', 0.15);
    },
    playBreak: () => {
      audio.playNote('E4', 'sine', 0.15);
      setTimeout(() => audio.playNote('G4', 'sine', 0.15), 80);
      setTimeout(() => audio.playNote('B4', 'sine', 0.15), 160);
      setTimeout(() => audio.playNote('E5', 'sine', 0.2), 320);
    },
  };
}
