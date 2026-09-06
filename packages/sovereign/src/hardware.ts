// @p31/sovereign — Hardware command protocol (TLV) + BLE/WebSocket transports
// Add Web Bluetooth type declarations
declare global {
  interface Navigator {
    bluetooth: any;
  }
}
type BluetoothDevice = any;
type BluetoothRemoteGATTCharacteristic = any;

import type { SignedUCAN, P31Capability } from './ucan';

export interface HardwareTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  onReceive(handler: (data: Uint8Array) => void): void;
  isConnected(): boolean;
}

export const CMD = {
  HAPTIC:       0x01,
  SE050_SIGN:   0x02,
  LORA_SEND:    0x03,
  LORA_RECV:    0x04,
  STATUS:       0x05,
  SYNC_DELTA:   0x06,
  GENESIS_HASH: 0x07,
} as const;

export interface HardwareStatus {
  battery: number;
  rssi: number;
  meshNodes: number;
  uptime: number;
  temperature?: number;
}

export const HAPTIC_EFFECTS = {
  CLICK: 1, BUZZ: 2, PULSE: 3, DOUBLE_CLICK: 4, TRIPLE_CLICK: 5,
  RAMP_UP: 6, RAMP_DOWN: 7, HEARTBEAT: 8, ALERT: 9, CONFIRMATION: 10,
} as const;

export type HapticEffect = number;

export function encodeCommand(cmd: number, payload: Uint8Array): Uint8Array {
  const buf = new Uint8Array(3 + payload.length);
  buf[0] = cmd;
  buf[1] = (payload.length >> 8) & 0xff;
  buf[2] = payload.length & 0xff;
  buf.set(payload, 3);
  return buf;
}

export function decodeCommand(data: Uint8Array): { cmd: number; payload: Uint8Array } | null {
  if (data.length < 3) return null;
  // const _cmd = data[0];
  const length = (data[1]! << 8) | data[2]!;
  if (data.length !== 3 + length) return null;
  return { cmd: data[0]!, payload: data.slice(3) };
}

export function encodeHapticCommand(effect: HapticEffect, intensity: number = 100): Uint8Array {
  const intensityByte = Math.max(0, Math.min(255, Math.round(intensity * 2.55)));
  return encodeCommand(CMD.HAPTIC, new Uint8Array([effect, intensityByte]));
}

export function encodeSignCommand(data: Uint8Array): Uint8Array {
  return encodeCommand(CMD.SE050_SIGN, data);
}

export function encodeLoRaCommand(portnum: number, payload: Uint8Array): Uint8Array {
  const header = new Uint8Array(2);
  header[0] = (portnum >> 8) & 0xff;
  header[1] = portnum & 0xff;
  const combined = new Uint8Array(header.length + payload.length);
  combined.set(header);
  combined.set(payload, header.length);
  return encodeCommand(CMD.LORA_SEND, combined);
}

export function encodeSyncDelta(delta: Uint8Array): Uint8Array {
  return encodeCommand(CMD.SYNC_DELTA, delta);
}

export function decodeStatusResponse(payload: Uint8Array): HardwareStatus | null {
  if (payload.length < 4) return null;
  return {
    battery: payload[0]!,
    rssi: (payload[1]! << 24 >> 24),
    meshNodes: payload[2]!,
    uptime: (payload[3]! << 24) | (payload[4]! << 16) | (payload[5]! << 8) | payload[6]!,
    temperature: payload.length > 7 ? payload[7]! - 40 : undefined,
  } as HardwareStatus;
}

export function decodeSignatureResponse(payload: Uint8Array): Uint8Array | null {
  if (payload.length !== 64) return null;
  return payload;
}

export class WebBLETransport implements HardwareTransport {
  private device: BluetoothDevice | null = null;
  private txChar: BluetoothRemoteGATTCharacteristic | null = null;
  private rxChar: BluetoothRemoteGATTCharacteristic | null = null;
  private receiveHandler: ((data: Uint8Array) => void) | null = null;
  private connected = false;

  static NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  static NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
  static NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

  async connect(): Promise<void> {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [WebBLETransport.NUS_SERVICE] }],
      optionalServices: [WebBLETransport.NUS_SERVICE],
    });
    const server = await this.device.gatt!.connect();
    const service = await server.getPrimaryService(WebBLETransport.NUS_SERVICE);
    this.txChar = await service.getCharacteristic(WebBLETransport.NUS_TX);
    this.rxChar = await service.getCharacteristic(WebBLETransport.NUS_RX);
    await this.txChar.startNotifications();
    this.txChar.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (value && this.receiveHandler) this.receiveHandler(new Uint8Array(value.buffer));
    });
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.device = null; this.txChar = null; this.rxChar = null; this.connected = false;
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.rxChar) throw new Error('Not connected');
    const MTU = 20;
    for (let i = 0; i < data.length; i += MTU) {
      await this.rxChar.writeValueWithResponse(data.slice(i, i + MTU));
    }
  }

  onReceive(handler: (data: Uint8Array) => void): void { this.receiveHandler = handler; }
  isConnected(): boolean { return this.connected; }
}

export class WebSocketTransport implements HardwareTransport {
  private ws: WebSocket | null = null;
  private receiveHandler: ((data: Uint8Array) => void) | null = null;
  private connected = false;

  constructor(private url: string = 'ws://192.168.4.1/ws') {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => { this.connected = true; resolve(); };
      this.ws.onclose = () => { this.connected = false; };
      this.ws.onerror = (error) => { reject(error); };
      this.ws.onmessage = (event) => {
        if (this.receiveHandler) {
          if (event.data instanceof ArrayBuffer) this.receiveHandler(new Uint8Array(event.data));
          else if (typeof event.data === 'string') this.receiveHandler(new TextEncoder().encode(event.data));
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;
  }

  async send(data: Uint8Array): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('WebSocket not connected');
    this.ws.send(data);
  }

  onReceive(handler: (data: Uint8Array) => void): void { this.receiveHandler = handler; }
  isConnected(): boolean { return this.connected; }
}

export function createTransport(): HardwareTransport {
  const globalWindow = window as typeof window & { __TAURI__?: unknown };
  if (globalWindow.__TAURI__) return new WebSocketTransport();
  if ('bluetooth' in navigator) return new WebBLETransport();
  return new WebSocketTransport();
}

export class HardwareManager {
  private transport: HardwareTransport;
  private ucan: SignedUCAN | null = null;
  private statusCallbacks: ((status: HardwareStatus) => void)[] = [];
  private syncCallbacks: ((delta: Uint8Array) => void)[] = [];

  constructor() {
    this.transport = createTransport();
    this.transport.onReceive(this.handleReceive.bind(this));
  }

  async connect(): Promise<void> {
    await this.transport.connect();
    await this.requestStatus();
    setInterval(() => this.requestStatus(), 30000);
  }

  async disconnect(): Promise<void> { await this.transport.disconnect(); }
  isConnected(): boolean { return this.transport.isConnected(); }

  async triggerHaptic(effect: HapticEffect, intensity: number = 100): Promise<void> {
    await this.transport.send(encodeHapticCommand(effect, intensity));
  }

  async sendLoRaMessage(portnum: number, payload: Uint8Array): Promise<void> {
    await this.transport.send(encodeLoRaCommand(portnum, payload));
  }

  async sendSyncDelta(delta: Uint8Array): Promise<void> {
    await this.transport.send(encodeSyncDelta(delta));
  }

  async requestStatus(): Promise<void> {
    await this.transport.send(encodeCommand(CMD.STATUS, new Uint8Array(0)));
  }

  onStatusUpdate(callback: (status: HardwareStatus) => void): void { this.statusCallbacks.push(callback); }
  onSyncDelta(callback: (delta: Uint8Array) => void): void { this.syncCallbacks.push(callback); }

  private handleReceive(data: Uint8Array): void {
    const decoded = decodeCommand(data);
    if (!decoded) return;
    switch (decoded.cmd) {
      case CMD.STATUS: {
        const status = decodeStatusResponse(decoded.payload);
        if (status) this.statusCallbacks.forEach(cb => cb(status));
        break;
      }
      case CMD.SYNC_DELTA:
        this.syncCallbacks.forEach(cb => cb(decoded.payload));
        break;
    }
  }

  setUCAN(ucan: SignedUCAN | null): void { this.ucan = ucan; }
  hasCapability(_capability: P31Capability): boolean { return this.ucan !== null; }
}
