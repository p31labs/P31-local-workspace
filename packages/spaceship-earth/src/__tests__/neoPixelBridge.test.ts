import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('NeoPixelBridge', () => {
  let mockSetLedMode: ReturnType<typeof vi.fn>;
  let mockSetLedSpeed: ReturnType<typeof vi.fn>;
  let mockSetLedColor: ReturnType<typeof vi.fn>;
  let mockSetLedBrightness: ReturnType<typeof vi.fn>;

  let resetNeoPixelBridge: () => void;
  let getNeoPixelBridge: () => {
    setMode: (_: string) => void;
    setSpeed: (_: number) => void;
    setColor: (_: string) => void;
    setBrightness: (_: number) => void;
    flush: () => void;
    dispatchTheme: (_: string) => Promise<void>;
    dispatchCoherence: (_: number) => Promise<void>;
    dispatchSpoons: (_: number) => Promise<void>;
    setHardwareMode: (_: boolean) => void;
    isHardwareMode: () => boolean;
  };

  beforeEach(async () => {
    mockSetLedMode = vi.fn();
    mockSetLedSpeed = vi.fn();
    mockSetLedColor = vi.fn();
    mockSetLedBrightness = vi.fn();

    vi.resetModules();
    vi.doMock('../store/shipStore', () => ({
      useShipStore: {
        getState: () => ({
          setLedMode: mockSetLedMode,
          setLedSpeed: mockSetLedSpeed,
          setLedColor: mockSetLedColor,
          setLedBrightness: mockSetLedBrightness,
        }),
      },
    }));

    const mod = await import('../services/neoPixelBridge');
    resetNeoPixelBridge = (mod as any).resetNeoPixelBridge;
    getNeoPixelBridge = (mod as any).getNeoPixelBridge;
    resetNeoPixelBridge();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('simulation mode', () => {
    it('updates shipStore immediately on setMode', () => {
      const bridge = getNeoPixelBridge();
      bridge.setMode('chase');
      expect(mockSetLedMode).toHaveBeenCalledWith('chase');
    });

    it('updates shipStore immediately on setSpeed', () => {
      const bridge = getNeoPixelBridge();
      bridge.setSpeed(7);
      expect(mockSetLedSpeed).toHaveBeenCalledWith(7);
    });

    it('updates shipStore immediately on setColor', () => {
      const bridge = getNeoPixelBridge();
      bridge.setColor('#ff0000');
      expect(mockSetLedColor).toHaveBeenCalledWith('#ff0000');
    });

    it('updates shipStore immediately on setBrightness', () => {
      const bridge = getNeoPixelBridge();
      bridge.setBrightness(50);
      expect(mockSetLedBrightness).toHaveBeenCalledWith(50);
    });

    it('batches changes without dispatching to hardware', () => {
      const bridge = getNeoPixelBridge();
      const inst = bridge as any;
      const spyTheme = vi.spyOn(inst, 'dispatchTheme');
      const spyCoherence = vi.spyOn(inst, 'dispatchCoherence');
      const spySpoons = vi.spyOn(inst, 'dispatchSpoons');
      bridge.setMode('solid');
      bridge.setColor('#ffffff');
      bridge.setBrightness(90);
      bridge.flush();
      expect(spyTheme).not.toHaveBeenCalled();
      expect(spyCoherence).not.toHaveBeenCalled();
      expect(spySpoons).not.toHaveBeenCalled();
    });
  });

  describe('hardware mode via setHardwareMode', () => {
    it('does not update shipStore on setters when in hardware mode', () => {
      const bridge = getNeoPixelBridge();
      bridge.setHardwareMode(true);
      mockSetLedMode.mockClear();
      mockSetLedSpeed.mockClear();
      mockSetLedColor.mockClear();
      mockSetLedBrightness.mockClear();
      bridge.setMode('gradient');
      bridge.setColor('#00ff00');
      bridge.setBrightness(75);
      expect(mockSetLedMode).not.toHaveBeenCalled();
      expect(mockSetLedColor).not.toHaveBeenCalled();
      expect(mockSetLedBrightness).not.toHaveBeenCalled();
    });

    it('flush calls dispatchTheme, dispatchCoherence, dispatchSpoons with batched values', () => {
      const bridge = getNeoPixelBridge();
      bridge.setHardwareMode(true);
      const inst = bridge as any;
      const spyTheme = vi.spyOn(inst, 'dispatchTheme');
      const spyCoherence = vi.spyOn(inst, 'dispatchCoherence');
      const spySpoons = vi.spyOn(inst, 'dispatchSpoons');
      bridge.setMode('gradient');
      bridge.setSpeed(8);
      bridge.setBrightness(90);
      bridge.flush();
      expect(spyTheme).toHaveBeenCalledWith('gradient');
      expect(spyCoherence).toHaveBeenCalledWith(0.8);
      expect(spySpoons).toHaveBeenCalledWith(230);
    });

    it('switches back to simulation and syncs store with batched values', () => {
      const bridge = getNeoPixelBridge();
      bridge.setHardwareMode(true);
      bridge.setMode('dual-chase');
      bridge.setSpeed(6);
      bridge.setColor('#abcd00');
      bridge.setBrightness(60);
      const modeFn = mockSetLedMode;
      const speedFn = mockSetLedSpeed;
      const colorFn = mockSetLedColor;
      const brightFn = mockSetLedBrightness;
      bridge.setHardwareMode(false);
      expect(modeFn).toHaveBeenCalledWith('dual-chase');
      expect(speedFn).toHaveBeenCalledWith(6);
      expect(colorFn).toHaveBeenCalledWith('#abcd00');
      expect(brightFn).toHaveBeenCalledWith(60);
    });

    it('flush is a no-op in simulation mode', () => {
      const bridge = getNeoPixelBridge();
      const inst = bridge as any;
      const spyTheme = vi.spyOn(inst, 'dispatchTheme');
      const spyCoherence = vi.spyOn(inst, 'dispatchCoherence');
      const spySpoons = vi.spyOn(inst, 'dispatchSpoons');
      bridge.flush();
      expect(spyTheme).not.toHaveBeenCalled();
      expect(spyCoherence).not.toHaveBeenCalled();
      expect(spySpoons).not.toHaveBeenCalled();
    });
  });

  describe('singleton', () => {
    it('returns same instance across calls', () => {
      const b1 = getNeoPixelBridge();
      const b2 = getNeoPixelBridge();
      expect(b1).toBe(b2);
    });
  });

  describe('hardware mode toggle', () => {
    it('isHardwareMode reflects current mode', () => {
      const bridge = getNeoPixelBridge();
      expect(bridge.isHardwareMode()).toBe(false);
      bridge.setHardwareMode(true);
      expect(bridge.isHardwareMode()).toBe(true);
      bridge.setHardwareMode(false);
      expect(bridge.isHardwareMode()).toBe(false);
    });
  });
});
