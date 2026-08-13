import { useShipStore } from '../store/shipStore';
import { nodeZeroBridge } from './nodeZeroBridge';
import type { LedMode } from '../store/shipStore';

export interface LedCommand {
  mode: LedMode;
  speed: number;
  color: string;
  brightness: number;
}

export interface NeoPixelBridge {
  setMode(mode: LedMode): void;
  setSpeed(speed: number): void;
  setColor(color: string): void;
  setBrightness(brightness: number): void;
  flush(): void;
}

export class NeoPixelBridgeImpl implements NeoPixelBridge {
  private mode: 'simulation' | 'hardware' = 'simulation';
  private batch: LedCommand = {
    mode: 'rainbow',
    speed: 5,
    color: '#22d3ee',
    brightness: 80,
  };

  setMode(mode: LedMode): void {
    this.batch.mode = mode;
    if (this.mode === 'simulation') {
      useShipStore.getState().setLedMode(mode);
    }
  }

  setSpeed(speed: number): void {
    this.batch.speed = speed;
    if (this.mode === 'simulation') {
      useShipStore.getState().setLedSpeed(speed);
    }
  }

  setColor(color: string): void {
    this.batch.color = color;
    if (this.mode === 'simulation') {
      useShipStore.getState().setLedColor(color);
    }
  }

  setBrightness(brightness: number): void {
    this.batch.brightness = brightness;
    if (this.mode === 'simulation') {
      useShipStore.getState().setLedBrightness(brightness);
    }
  }

  setHardwareMode(enabled: boolean): void {
    if (this.mode === (enabled ? 'hardware' : 'simulation')) return;
    if (enabled) {
      // Seed the hardware batch from the current UI state so hardware dispatch
      // reflects what the user sees.
      const state = useShipStore.getState();
      this.batch = {
        mode: state.ledMode,
        speed: state.ledSpeed,
        color: state.ledColor,
        brightness: state.ledBrightness,
      };
      this.mode = 'hardware';
    } else {
      // Return to simulation: sync the last hardware batch back into the store.
      this.mode = 'simulation';
      const state = useShipStore.getState();
      state.setLedMode(this.batch.mode);
      state.setLedSpeed(this.batch.speed);
      state.setLedColor(this.batch.color);
      state.setLedBrightness(this.batch.brightness);
    }
  }

  isHardwareMode(): boolean {
    return this.mode === 'hardware';
  }

  dispatchTheme(mode: string): Promise<void> {
    return nodeZeroBridge.writeTheme(mode);
  }

  dispatchCoherence(value: number): Promise<void> {
    return nodeZeroBridge.writeCoherence(value);
  }

  dispatchSpoons(value: number): Promise<void> {
    return nodeZeroBridge.writeSpoons(value);
  }

  flush(): void {
    if (this.mode !== 'hardware') return;
    try {
      this.dispatchTheme(this.batch.mode).catch(() => {});
      this.dispatchCoherence(this.batch.speed / 10).catch(() => {});
      this.dispatchSpoons(Math.round(this.batch.brightness / 100 * 255)).catch(() => {});
    } catch {
      // Hardware dispatch is best-effort; failure does not crash the UI.
    }
  }
}

let instance: NeoPixelBridgeImpl | null = null;

export function getNeoPixelBridge(): NeoPixelBridgeImpl {
  if (!instance) instance = new NeoPixelBridgeImpl();
  return instance;
}

export function resetNeoPixelBridge(): void {
  instance = null;
}
