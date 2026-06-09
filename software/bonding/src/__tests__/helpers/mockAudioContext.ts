// ═══════════════════════════════════════════════════════════════════
// BONDING — Mock AudioContext for Tests
// Full Web Audio API mock: OscillatorNode, GainNode, PannerNode, AudioBuffer
// Tracks: frequencies assigned, gain values, panning models, buffer lengths
// Used by: spatialAudio, ambientEngine, sound, consoleEgg tests
// ═══════════════════════════════════════════════════════════════════

import { vi } from 'vitest';

// Track all created nodes for verification
export const createdOscillators: MockOscillatorNode[] = [];
export const createdGainNodes: MockGainNode[] = [];
export const createdPannerNodes: MockPannerNode[] = [];
export const createdBuffers: MockAudioBuffer[] = [];

export function resetAudioMocks(): void {
  createdOscillators.length = 0;
  createdGainNodes.length = 0;
  createdPannerNodes.length = 0;
  createdBuffers.length = 0;
}

// Mock AudioBuffer
export class MockAudioBuffer {
  length: number;
  sampleRate: number;
  duration: number;
  numberOfChannels: number;

  constructor(length: number = 44100, sampleRate: number = 44100) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.numberOfChannels = 1;
    createdBuffers.push(this);
  }

  getChannelData(_channel: number): Float32Array {
    return new Float32Array(this.length);
  }
}

// Mock GainNode
export class MockGainNode {
  gain: MockAudioParam;
  context: MockAudioContext;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.gain = new MockAudioParam(1);
    createdGainNodes.push(this);
  }

  connect(destination: MockAudioNode): MockAudioNode {
    return destination;
  }

  disconnect(): void {
    // noop
  }
}

// Mock AudioParam
export class MockAudioParam {
  value: number;
  private _valueAtTimeCalls: Array<{ value: number; time: number }> = [];

  constructor(initialValue: number) {
    this.value = initialValue;
  }

  setValueAtTime(value: number, time: number): void {
    this._valueAtTimeCalls.push({ value, time });
    this.value = value;
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this._valueAtTimeCalls.push({ value, time });
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number, time: number): void {
    this._valueAtTimeCalls.push({ value, time });
    this.value = value;
  }

  getValueAtTime(_time: number): number {
    return this.value;
  }

  get linearRampCalls(): Array<{ value: number; time: number }> {
    return this._valueAtTimeCalls;
  }
}

// Mock OscillatorNode
export class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency: MockAudioParam;
  context: MockAudioContext;
  private _started = false;
  private _stopped = false;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.frequency = new MockAudioParam(440);
    createdOscillators.push(this);
  }

  connect(destination: MockAudioNode): MockAudioNode {
    return destination;
  }

  disconnect(): void {
    // noop
  }

  start(time?: number): void {
    this._started = true;
    if (time !== undefined && time > this.context.currentTime) {
      // Would schedule start - for testing we consider it started
    }
  }

  stop(time?: number): void {
    this._stopped = true;
    if (time !== undefined && time > this.context.currentTime) {
      // Would schedule stop
    }
  }

  get isStarted(): boolean {
    return this._started && !this._stopped;
  }
}

// Mock PannerNode
export class MockPannerNode {
  panningModel: PanningModelType = 'HRTF';
  pannerModel: string = 'HRTF';
  positionX: MockAudioParam;
  positionY: MockAudioParam;
  positionZ: MockAudioParam;
  context: MockAudioContext;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.positionX = new MockAudioParam(0);
    this.positionY = new MockAudioParam(0);
    this.positionZ = new MockAudioParam(0);
    createdPannerNodes.push(this);
  }

  connect(destination: MockAudioNode): MockAudioNode {
    return destination;
  }

  disconnect(): void {
    // noop
  }

  setPosition(x: number, y: number, z: number): void {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  }
}

// Minimal MockAudioNode base
export interface MockAudioNode {
  connect(destination: MockAudioNode): MockAudioNode;
  disconnect(): void;
}

// Mock AudioContext
export class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime: number = 0;
  sampleRate: number = 44100;
  destination: MockAudioNode;
  listener: MockAudioListener;

  private _timeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destination = this._createNode();
    this.listener = new MockAudioListener();
    
    // Advance time automatically
    this._timeInterval = setInterval(() => {
      this.currentTime += 0.1;
    }, 100);
  }

  private _createNode(): MockAudioNode {
    return {
      connect: (d) => d,
      disconnect: () => {},
    };
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  createPanner(): MockPannerNode {
    return new MockPannerNode(this);
  }

  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ): MockAudioBuffer {
    return new MockAudioBuffer(length, sampleRate);
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode(this);
  }

  resume(): Promise<void> {
    if (this.state === 'suspended') {
      this.state = 'running';
    }
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    if (this._timeInterval) {
      clearInterval(this._timeInterval);
      this._timeInterval = null;
    }
    return Promise.resolve();
  }
}

// Mock AudioListener
export class MockAudioListener {
  positionX: MockAudioParam;
  positionY: MockAudioParam;
  positionZ: MockAudioParam;
  forwardX: MockAudioParam;
  forwardY: MockAudioParam;
  forwardZ: MockAudioParam;
  upX: MockAudioParam;
  upY: MockAudioParam;
  upZ: MockAudioParam;

  constructor() {
    this.positionX = new MockAudioParam(0);
    this.positionY = new MockAudioParam(0);
    this.positionZ = new MockAudioParam(0);
    this.forwardX = new MockAudioParam(0);
    this.forwardY = new MockAudioParam(0);
    this.forwardZ = new MockAudioParam(-1);
    this.upX = new MockAudioParam(0);
    this.upY = new MockAudioParam(1);
    this.upZ = new MockAudioParam(0);
  }
}

// Mock BiquadFilterNode
export class MockBiquadFilterNode {
  type: BiquadFilterType = 'lowpass';
  frequency: MockAudioParam;
  Q: MockAudioParam;
  gain: MockAudioParam;
  context: MockAudioContext;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.frequency = new MockAudioParam(1000);
    this.Q = new MockAudioParam(1);
    this.gain = new MockAudioParam(0);
  }

  connect(destination: MockAudioNode): MockAudioNode {
    return destination;
  }

  disconnect(): void {
    // noop
  }
}

// Factory to create a fresh mock for each test
export function createMockAudioContext(): MockAudioContext {
  resetAudioMocks();
  return new MockAudioContext();
}

// Setup function to use in tests
export function setupAudioContextMock(): void {
  vi.stubGlobal('AudioContext', MockAudioContext);
  vi.stubGlobal('webkitAudioContext', MockAudioContext);
}

export function teardownAudioContextMock(): void {
  resetAudioMocks();
}