import { useEffect, useCallback } from 'react';

// SHOWCASE_CHANNEL_ID= (add to .env for Discord bot integration)

declare global {
  interface Window {
    triggerLarmor?: () => void;
    lockTone?: () => void;
  }
}

export const useConsoleEgg = () => {
  const triggerLarmor = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(863, audioCtx.currentTime); // Larmor frequency

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      // Smooth fade out over 3.9 seconds
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.9);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 3.9);
      console.log("%c[DEVTOOLS EGG] Larmor Frequency (863 Hz) triggered.", "color: #9c27b0;");
    } catch (e) {
      console.error("Audio context failed:", e);
    }
  }, []);

  const lockTone = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(172.35, audioCtx.currentTime); // Acoustic Egg frequency

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      // Smooth fade out over 3.9 seconds
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.9);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 3.9);
      console.log("%c[ACOUSTIC EGG] 172.35 Hz tone locked in.", "color: #9c27b0;");
    } catch (e) {
      console.error("Audio context failed:", e);
    }
  }, []);

  useEffect(() => {
    const asciiTetrahedron = `
       /\\
      /  \\
     /____\\
    \\      /
     \\    /
      \\  /
       \\/
    `;

    // Log the ASCII Tetrahedron with large, purple font as requested
    console.info(
      `%c${asciiTetrahedron}\nMaxwell's rigidity math initialized.\nType window.triggerLarmor() or window.lockTone() to initiate.`,
      'color: #9c27b0; font-size: 16px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);'
    );

    // Expose functions to the global window object
    window.triggerLarmor = triggerLarmor;
    window.lockTone = lockTone;

    return () => {
      // Clean up global references on unmount
      delete window.triggerLarmor;
      delete window.lockTone;
    };
  }, [triggerLarmor, lockTone]);

  return { triggerLarmor, lockTone };
};

export default useConsoleEgg;
