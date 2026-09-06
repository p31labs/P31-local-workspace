import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useFrequencySynthesis - Audio frequency synthesis for 31P NMR resonance
 * 
 * Generates tones at 172.35 Hz (phosphorus-31 NMR frequency in Earth's field)
 * and other relevant frequencies from the P31 research.
 * 
 * Frequencies:
 * - 172.35 Hz: Phosphorus-31 NMR (Larmor frequency in 50μT field)
 * - 863 Hz: 31P Larmor frequency calculation (17.235 MHz/T × 50.07 μT)
 * - 528 Hz: DNA repair frequency (solfeggio)
 * - 396 Hz: Emotional release (solfeggio)
 * - 417 Hz: Change/s transformation (solfeggio)
 */
export function useFrequencySynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(null);
  const [gain, setGain] = useState(0.5); // Default 50% volume
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const noiseNodeRef = useRef(null);

  // Available frequencies from research
  const FREQUENCIES = {
    P31_NMR: 172.35,        // Phosphorus-31 NMR (Larmor in 50μT)
    LARMOR_863HZ: 863,      // Calculated 31P Larmor
    DNA_REPAIR: 528,       // Solfeggio
    EMOTIONAL: 396,        // Solfeggio
    TRANSFORMATION: 417,   // Solfeggio
  };

  /**
   * Initialize AudioContext on demand
   */
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Play a specific frequency
   */
  const play = useCallback((frequency = FREQUENCIES.P31_NMR, options = {}) => {
    const ctx = initAudio();
    
    // Stop any existing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = options.type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(options.gain ?? gain, ctx.currentTime);

    // Apply fade in/out if specified
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(options.gain ?? gain, ctx.currentTime + options.fadeIn);
    }
    if (options.fadeOut) {
      const now = ctx.currentTime;
      const duration = options.duration || 10;
      gainNode.gain.setValueAtTime(options.gain ?? gain, now + duration - options.fadeOut);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }

    // Connect chain: oscillator → gain → destination
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Start
    oscillator.start();

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
    setCurrentFrequency(frequency);
    setIsPlaying(true);

    return {
      stop: () => {
        oscillator.stop();
        setIsPlaying(false);
      },
      setFrequency: (freq) => {
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        setCurrentFrequency(freq);
      },
      setGain: (g) => {
        gainNode.gain.setValueAtTime(g, ctx.currentTime);
        setGain(g);
      },
    };
  }, [gain, initAudio]);

  /**
   * Play the P31 NMR frequency (172.35 Hz)
   */
  const playP31NMR = useCallback((options = {}) => {
    return play(FREQUENCIES.P31_NMR, options);
  }, [play]);

  /**
   * Play with binaural beat effect (two ears, offset frequency)
   */
  const playBinaural = useCallback((baseFrequency = FREQUENCIES.P31_NMR, beatFrequency = 10, options = {}) => {
    const ctx = initAudio();

    // Stop existing
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
    }

    // Create left ear oscillator (base freq)
    const leftOsc = ctx.createOscillator();
    leftOsc.type = options.type || 'sine';
    leftOsc.frequency.setValueAtTime(baseFrequency, ctx.currentTime);

    // Create right ear oscillator (base + beat = binaural)
    const rightOsc = ctx.createOscillator();
    rightOsc.type = options.type || 'sine';
    rightOsc.frequency.setValueAtTime(baseFrequency + beatFrequency, ctx.currentTime);

    // Create stereo panner for left/right
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.setValueAtTime(options.gain ?? gain, ctx.currentTime);
    rightGain.gain.setValueAtTime(options.gain ?? gain, ctx.currentTime);

    // Create StereoPannerNode (or fallback to ChannelSplitter/Merger)
    let leftPan, rightPan;
    if (ctx.createStereoPanner) {
      leftPan = ctx.createStereoPanner();
      rightPan = ctx.createStereoPanner();
      leftPan.pan.setValueAtTime(-1, ctx.currentTime);
      rightPan.pan.setValueAtTime(1, ctx.currentTime);
    } else {
      // Fallback: simpler stereo using gain
      leftPan = leftGain;
      rightPan = rightGain;
    }

    leftOsc.connect(leftPan);
    rightOsc.connect(rightPan);
    leftPan.connect(ctx.destination);
    rightPan.connect(ctx.destination);

    leftOsc.start();
    rightOsc.start();

    oscillatorRef.current = { left: leftOsc, right: rightOsc };
    setCurrentFrequency(`${baseFrequency}/${baseFrequency + beatFrequency}`);
    setIsPlaying(true);

    return {
      stop: () => {
        leftOsc.stop();
        rightOsc.stop();
        setIsPlaying(false);
      },
      setBaseFrequency: (freq) => {
        leftOsc.frequency.setValueAtTime(freq, ctx.currentTime);
        rightOsc.frequency.setValueAtTime(freq + beatFrequency, ctx.currentTime);
      },
      setBeatFrequency: (beat) => {
        rightOsc.frequency.setValueAtTime(baseFrequency + beat, ctx.currentTime);
      },
    };
  }, [gain, initAudio]);

  /**
   * Play white/pink noise for ambient background
   */
  const playNoise = useCallback((type = 'white', options = {}) => {
    const ctx = initAudio();

    // Stop existing
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
    }
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create noise buffer
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // Pink noise algorithm (Paul Kellet's refined method)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Create filter for different noise characteristics
    if (options.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = options.filter.type || 'lowpass';
      filter.frequency.setValueAtTime(options.filter.freq || 1000, ctx.currentTime);
      noise.connect(filter);
      filter.connect(ctx.destination);
    } else {
      noise.connect(ctx.destination);
    }

    // Gain control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(options.gain ?? 0.1, ctx.currentTime);
    noise.connect(gainNode);

    noise.start();
    noiseNodeRef.current = noise;
    gainNodeRef.current = gainNode;
    setCurrentFrequency(type === 'white' ? 'white_noise' : 'pink_noise');
    setIsPlaying(true);

    return {
      stop: () => {
        noise.stop();
        setIsPlaying(false);
      },
      setGain: (g) => {
        gainNode.gain.setValueAtTime(g, ctx.currentTime);
        setGain(g);
      },
    };
  }, []);

  /**
   * Stop all audio
   */
  const stop = useCallback(() => {
    if (oscillatorRef.current) {
      if (oscillatorRef.current.stop) {
        oscillatorRef.current.stop();
      } else {
        // Binaural case (object with left/right)
        oscillatorRef.current.left?.stop();
        oscillatorRef.current.right?.stop();
      }
      oscillatorRef.current = null;
    }
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
    setCurrentFrequency(null);
  }, []);

  /**
   * Set master gain
   */
  const setVolume = useCallback((newGain) => {
    setGain(Math.max(0, Math.min(1, newGain)));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newGain, audioContextRef.current.currentTime);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    isPlaying,
    currentFrequency,
    gain,
    frequencies: FREQUENCIES,
    play,
    playP31NMR,
    playBinaural,
    playNoise,
    stop,
    setVolume,
  };
}

export default useFrequencySynthesis;