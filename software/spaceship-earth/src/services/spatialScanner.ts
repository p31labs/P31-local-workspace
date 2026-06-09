/** Pluggable BLE scanner interface for the Spatial Mesh (WCD-M20). */

export interface RawScanResult {
  id: string;
  rssi: number;
  manufacturerData?: Uint8Array;
}

export interface SpatialScanner {
  start(): Promise<void>;
  stop(): void;
  onScan(cb: (devices: RawScanResult[]) => void): void;
}

// ── Web Bluetooth Scanner ──
// Requires chrome://flags/#enable-experimental-web-platform-features on Android Chrome.
// Will throw if API unavailable — caller should catch and fall back to WebSocket.

export class WebBluetoothScanner implements SpatialScanner {
  private callback: ((devices: RawScanResult[]) => void) | null = null;
  private abortController: AbortController | null = null;

  async start(): Promise<void> {
    const bt = navigator.bluetooth;
    if (!bt || typeof bt.requestLEScan !== 'function') {
      throw new Error('Web Bluetooth Scanning API not available');
    }

    this.abortController = new AbortController();

    // requestLEScan is experimental — type assertion needed
    await (bt as any).requestLEScan({
      acceptAllAdvertisements: true,
      signal: this.abortController.signal,
    });

    (bt as any).addEventListener('advertisementreceived', this.handleAdvertisement);
  }

  stop(): void {
    this.abortController?.abort();
    (navigator.bluetooth as any)?.removeEventListener?.('advertisementreceived', this.handleAdvertisement);
  }

  onScan(cb: (devices: RawScanResult[]) => void): void {
    this.callback = cb;
  }

  private handleAdvertisement = (event: any) => {
    if (!this.callback) return;

    let mfgData: Uint8Array | undefined;
    if (event.manufacturerData) {
      // manufacturerData is a BluetoothManufacturerDataMap
      for (const [, value] of event.manufacturerData) {
        mfgData = new Uint8Array(value.buffer);
        break; // take first manufacturer entry
      }
    }

    this.callback([{
      id: event.device?.id ?? 'unknown',
      rssi: event.rssi ?? -100,
      manufacturerData: mfgData,
    }]);
  };
}

// ── WebSocket Scanner ──
// Connects to a local Termux/ESP32 relay that pushes BLE scan results.
// Expected message format: { type: 'BLE_SCAN', devices: RawScanResult[] }

export class WebSocketScanner implements SpatialScanner {
  private ws: WebSocket | null = null;
  private callback: ((devices: RawScanResult[]) => void) | null = null;
  private url: string;

  constructor(url = 'ws://localhost:8081') {
    this.url = url;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('WebSocket scanner connection timeout'));
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket scanner connection failed'));
      };

      this.ws.onmessage = (event) => {
        if (!this.callback) return;
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'BLE_SCAN' && Array.isArray(data.devices)) {
            this.callback(data.devices.map((d: any) => ({
              id: String(d.id),
              rssi: Number(d.rssi),
              manufacturerData: d.manufacturerData
                ? new Uint8Array(d.manufacturerData)
                : undefined,
            })));
          }
        } catch { /* ignore malformed */ }
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
      };
    });
  }

  stop(): void {
    this.ws?.close();
    this.ws = null;
  }

  onScan(cb: (devices: RawScanResult[]) => void): void {
    this.callback = cb;
  }
}

// ── Manufacturer data parser ──
// Byte 0: valency (0-4 open bond sites)
// Byte 1: flags (bit 0 = handshake-ready, bit 1 = in-handshake)

export function parseMfgData(data?: Uint8Array): { valency: number; flags: number } {
  if (!data || data.length < 2) return { valency: 0, flags: 0 };
  return { valency: data[0] & 0x0f, flags: data[1] };
}

// ── RSSI EMA smoothing ──

export function emaSmooth(prev: number, raw: number, alpha = 0.3): number {
  return alpha * raw + (1 - alpha) * prev;
}
