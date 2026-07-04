import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

beforeEach(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  if (typeof globalThis.AudioContext === 'undefined') {
    const makeMockAudioContext = () => {
      const listeners: Record<string, Array<(...args: any[]) => void>> = {};
      const freqValues: Record<number, { value: number; time: number }> = {};
      const gainValues: Record<number, { value: number; time: number }> = {};
      let oscCounter = 0;
      let gainCounter = 0;
      let bufferCounter = 0;
      let sourceCounter = 0;
      let filterCounter = 0;

      return {
        close: vi.fn(),
        createOscillator: vi.fn(() => ({
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn((f: number, t: number) => { freqValues[oscCounter] = { value: f, time: t }; }),
            linearRampToValueAtTime: vi.fn((f: number, t: number) => { freqValues[oscCounter] = { value: f, time: t }; }),
            exponentialRampToValueAtTime: vi.fn(),
            get value() { return freqValues[oscCounter]?.value ?? 0; },
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: {
            setValueAtTime: vi.fn((v: number, t: number) => { gainValues[gainCounter] = { value: v, time: t }; }),
            linearRampToValueAtTime: vi.fn((v: number, t: number) => { gainValues[gainCounter] = { value: v, time: t }; }),
            exponentialRampToValueAtTime: vi.fn(),
            get value() { return gainValues[gainCounter]?.value ?? 0; },
          },
          connect: vi.fn(),
        })),
        createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
          length,
          numberOfChannels: channels,
          sampleRate,
          getChannelData: vi.fn(() => new Float32Array(length)),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createBiquadFilter: vi.fn(() => ({
          type: 'lowpass',
          frequency: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          Q: {
            setValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        })),
        destination: { connect: vi.fn() },
        state: 'running',
        currentTime: 0,
        sampleRate: 44100,
        suspend: vi.fn(),
        resume: vi.fn(),
      } as any;
    };

    globalThis.AudioContext = vi.fn(makeMockAudioContext) as any;
  }

  if (typeof globalThis.Worker === 'undefined') {
    globalThis.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
    })) as any;
  }

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  }) as any;
  if (typeof (globalThis as any).window !== 'undefined') {
    (globalThis as any).window.fetch = globalThis.fetch as any;
  }

  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as any;
  }

  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16);
    }) as any;
    globalThis.cancelAnimationFrame = vi.fn((id: number) => {
      clearTimeout(id);
    }) as any;
  }

  if (typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype) {
    HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextId: string) {
      if (contextId === '2d') {
        return {
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(0) }),
          putImageData: vi.fn(),
          createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(0) }),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          fillText: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          measureText: vi.fn().mockReturnValue({ width: 0 }),
          transform: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as any;
  }
});
