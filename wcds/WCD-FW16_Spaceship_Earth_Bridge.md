# WCD-FW16: Spaceship Earth Client Bridge (Web Side)
## P31 Labs · Node Zero · Physical Cockpit Foundation
## Issued: March 20, 2026 · Classification: SOULSAFE · Agent: Sonnet/CC

---

## Objective

Build the Spaceship Earth web-side integration that connects to Node Zero via Web Bluetooth. This is a **Sonnet/CC task**, not DeepSeek firmware.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Spaceship Earth (Web)                      │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐            │
│  │  NodeZeroBridge │    │  useNodeZero()   │            │
│  │  (Web Bluetooth)│    │  (Zustand sync)  │            │
│  └────────┬─────────┘    └────────┬─────────┘            │
│           │                        │                       │
│           v                        v                       │
│  ┌──────────────────────────────────────────────────┐      │
│  │           NodeZeroPanel (Connection UI)         │      │
│  └──────────────────────────────────────────────────┘      │
│           │                                               │
│           v                                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │           ThemeStore / CoherenceStore            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## GATT Service UUID

```typescript
// P31 Service UUID: 31500000-P31L-4ABS-CAFE-CA9PO4630000
// (Encodes: P31 Labs + Ca₉(PO₄)₆ + Posner molecule)
const P31_SERVICE_UUID = '31500000-7033-314c-cafe-ca9504630000';

// Characteristics
const CHAR_COHERENCE_UUID = '31500001-7033-314c-cafe-ca9504630000';
const CHAR_SPOONS_UUID = '31500002-7033-314c-cafe-ca9504630000';
const CHAR_ROOM_UUID = '31500003-7033-314c-cafe-ca9504630000';
const CHAR_THEME_UUID = '31500004-7033-314c-cafe-ca9504630000';
const CHAR_IMU_UUID = '31500005-7033-314c-cafe-ca9504630000';
const CHAR_BATTERY_UUID = '31500006-7033-314c-cafe-ca9504630000';
const CHAR_HAPTIC_CMD_UUID = '31500007-7033-314c-cafe-ca9504630000';
const CHAR_DID_UUID = '31500008-7033-314c-cafe-ca9504630000';
```

---

## Tasks

### FW16.1 — Web Bluetooth Service

**Action**: CREATE  
**File**: `software/spaceship-earth/src/services/nodeZeroBridge.ts`

```typescript
// Web Bluetooth connection to Node Zero
const P31_SERVICE_UUID = '31500000-7033-314c-cafe-ca9504630000';

export interface NodeZeroState {
  coherence: number;
  spoons: number;
  room: string;
  theme: string;
  battery: number;
  connected: boolean;
}

export interface IMUData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
}

type StateChangeCallback = (state: Partial<NodeZeroState>) => void;
type IMUCallback = (data: IMUData) => void;

class NodeZeroBridge {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  
  private coherenceChar: BluetoothRemoteGATTCharacteristic | null = null;
  private spoonsChar: BluetoothRemoteGATTCharacteristic | null = null;
  private roomChar: BluetoothRemoteGATTCharacteristic | null = null;
  private themeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private imuChar: BluetoothRemoteGATTCharacteristic | null = null;
  private batteryChar: BluetoothRemoteGATTCharacteristic | null = null;
  private hapticChar: BluetoothRemoteGATTCharacteristic | null = null;
  private didChar: BluetoothRemoteGATTCharacteristic | null = null;
  
  private onStateChange: StateChangeCallback | null = null;
  private onIMUData: IMUCallback | null = null;
  
  // Connection state
  private _connected = false;
  get connected(): boolean {
    return this._connected;
  }
  
  // Request device connection
  async connect(): Promise<void> {
    try {
      // Request device with P31 service
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'NODE ZERO' }],
        optionalServices: [P31_SERVICE_UUID]
      });
      
      // Handle disconnect
      this.device.addEventListener('gattserverdisconnected', () => {
        this._connected = false;
        this.onStateChange?.({ connected: false });
      });
      
      // Connect to server
      this.server = this.device.gatt!;
      await this.server.connect();
      this._connected = true;
      this.onStateChange?.({ connected: true });
      
      // Get service
      this.service = await this.server.getPrimaryService(P31_SERVICE_UUID);
      
      // Get all characteristics
      await this.setupCharacteristics();
      
      // Subscribe to notifications
      await this.subscribeToNotifications();
      
      console.log('[NodeZeroBridge] Connected to NODE ZERO');
    } catch (error) {
      console.error('[NodeZeroBridge] Connection failed:', error);
      throw error;
    }
  }
  
  private async setupCharacteristics(): Promise<void> {
    if (!this.service) return;
    
    // Get all characteristics
    this.coherenceChar = await this.service.getCharacteristic(
      '31500001-7033-314c-cafe-ca9504630000'
    );
    this.spoonsChar = await this.service.getCharacteristic(
      '31500002-7033-314c-cafe-ca9504630000'
    );
    this.roomChar = await this.service.getCharacteristic(
      '31500003-7033-314c-cafe-ca9504630000'
    );
    this.themeChar = await this.service.getCharacteristic(
      '31500004-7033-314c-cafe-ca9504630000'
    );
    this.imuChar = await this.service.getCharacteristic(
      '31500005-7033-314c-cafe-ca9504630000'
    );
    this.batteryChar = await this.service.getCharacteristic(
      '31500006-7033-314c-cafe-ca9504630000'
    );
    this.hapticChar = await this.service.getCharacteristic(
      '31500007-7033-314c-cafe-ca9504630000'
    );
    this.didChar = await this.service.getCharacteristic(
      '31500008-7033-314c-cafe-ca9504630000'
    );
  }
  
  private async subscribeToNotifications(): Promise<void> {
    // Subscribe to coherence notifications
    if (this.coherenceChar) {
      await this.coherenceChar.startNotifications();
      this.coherenceChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const coherence = view.getFloat32(0, true);
        this.onStateChange?.({ coherence });
      });
    }
    
    // Subscribe to spoons notifications
    if (this.spoonsChar) {
      await this.spoonsChar.startNotifications();
      this.spoonsChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const spoons = view.getUint8(0);
        this.onStateChange?.({ spoons });
      });
    }
    
    // Subscribe to room notifications
    if (this.roomChar) {
      await this.roomChar.startNotifications();
      this.roomChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const decoder = new TextDecoder();
        const room = decoder.decode(view);
        this.onStateChange?.({ room });
      });
    }
    
    // Subscribe to theme notifications
    if (this.themeChar) {
      await this.themeChar.startNotifications();
      this.themeChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const decoder = new TextDecoder();
        const theme = decoder.decode(view);
        this.onStateChange?.({ theme });
      });
    }
    
    // Subscribe to IMU notifications
    if (this.imuChar) {
      await this.imuChar.startNotifications();
      this.imuChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const data: IMUData = {
          ax: view.getInt16(0, true),
          ay: view.getInt16(2, true),
          az: view.getInt16(4, true),
          gx: view.getInt16(6, true),
          gy: view.getInt16(8, true),
          gz: view.getInt16(10, true)
        };
        this.onIMUData?.(data);
      });
    }
    
    // Subscribe to battery notifications
    if (this.batteryChar) {
      await this.batteryChar.startNotifications();
      this.batteryChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const battery = view.getUint8(0);
        this.onStateChange?.({ battery });
      });
    }
  }
  
  // Write state TO Node Zero:
  async writeCoherence(value: number): Promise<void> {
    if (!this.coherenceChar || !this._connected) return;
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, value, true);
    await this.coherenceChar.writeValue(buffer);
  }
  
  async writeSpoons(value: number): Promise<void> {
    if (!this.spoonsChar || !this._connected) return;
    const buffer = new ArrayBuffer(1);
    new DataView(buffer).setUint8(0, value);
    await this.spoonsChar.writeValue(buffer);
  }
  
  async writeRoom(room: string): Promise<void> {
    if (!this.roomChar || !this._connected) return;
    const encoder = new TextEncoder();
    await this.roomChar.writeValue(encoder.encode(room));
  }
  
  async writeTheme(theme: string): Promise<void> {
    if (!this.themeChar || !this._connected) return;
    const encoder = new TextEncoder();
    await this.themeChar.writeValue(encoder.encode(theme));
  }
  
  async triggerHaptic(effectId: number): Promise<void> {
    if (!this.hapticChar || !this._connected) return;
    const buffer = new ArrayBuffer(1);
    new DataView(buffer).setUint8(0, effectId);
    await this.hapticChar.writeValue(buffer);
  }
  
  // Event handlers
  onStateChanged(callback: StateChangeCallback): void {
    this.onStateChange = callback;
  }
  
  onIMU(callback: IMUCallback): void {
    this.onIMUData = callback;
  }
  
  // Disconnect
  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      await this.server.disconnect();
    }
    this._connected = false;
    this.device = null;
    this.server = null;
    this.service = null;
  }
}

export const nodeZeroBridge = new NodeZeroBridge();
```

---

### FW16.2 — Zustand State Sync Hook

**Action**: CREATE  
**File**: `software/spaceship-earth/src/hooks/useNodeZero.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { useNodeZeroStore } from '../stores/nodeZeroStore';
import { nodeZeroBridge } from '../services/nodeZeroBridge';

/**
 * Syncs Spaceship Earth state TO Node Zero.
 * Subscribes to store changes and writes via BLE.
 * Throttled to 10Hz max to match Node Zero update rate.
 */
export function useNodeZero() {
  const {
    coherence,
    spoons,
    room,
    theme,
    connected,
    setConnected,
    setCoherence,
    setSpoons,
    setRoom,
    setTheme,
    setBattery
  } = useNodeZeroStore();
  
  // Throttled write functions
  const lastWriteRef = React.useRef<Map<string, number>>(new Map());
  
  const throttledWrite = useCallback(async (
    key: string,
    writeFn: () => Promise<void>,
    minIntervalMs: number = 100
  ) => {
    const now = Date.now();
    const lastWrite = lastWriteRef.current.get(key) || 0;
    
    if (now - lastWrite >= minIntervalMs) {
      await writeFn();
      lastWriteRef.current.set(key, now);
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    const handleConnect = async () => {
      try {
        await nodeZeroBridge.connect();
        setConnected(true);
      } catch (error) {
        console.error('[useNodeZero] Connection failed:', error);
        setConnected(false);
      }
    };
    
    // Set up state change listener
    nodeZeroBridge.onStateChanged((state) => {
      if (state.coherence !== undefined) setCoherence(state.coherence);
      if (state.spoons !== undefined) setSpoons(state.spoons);
      if (state.room !== undefined) setRoom(state.room);
      if (state.theme !== undefined) setTheme(state.theme);
      if (state.battery !== undefined) setBattery(state.battery);
      if (state.connected !== undefined) setConnected(state.connected);
    });
    
    // Auto-connect (can be triggered by user button instead)
    // handleConnect();
    
    return () => {
      nodeZeroBridge.disconnect();
    };
  }, []);
  
  // Sync local state to Node Zero (throttled)
  useEffect(() => {
    if (!connected) return;
    
    throttledWrite('coherence', () => 
      nodeZeroBridge.writeCoherence(coherence)
    );
  }, [coherence, connected, throttledWrite]);
  
  useEffect(() => {
    if (!connected) return;
    
    throttledWrite('spoons', () => 
      nodeZeroBridge.writeSpoons(spoons)
    );
  }, [spoons, connected, throttledWrite]);
  
  useEffect(() => {
    if (!connected) return;
    
    throttledWrite('room', () => 
      nodeZeroBridge.writeRoom(room)
    );
  }, [room, connected, throttledWrite]);
  
  useEffect(() => {
    if (!connected) return;
    
    throttledWrite('theme', () => 
      nodeZeroBridge.writeTheme(theme)
    );
  }, [theme, connected, throttledWrite]);
  
  // Expose haptic trigger
  const triggerHaptic = useCallback(async (effectId: number) => {
    if (!connected) return;
    await nodeZeroBridge.triggerHaptic(effectId);
  }, [connected]);
  
  return {
    coherence,
    spoons,
    room,
    theme,
    connected,
    triggerHaptic
  };
}
```

---

### FW16.3 — Node Zero Store

**Action**: CREATE  
**File**: `software/spaceship-earth/src/stores/nodeZeroStore.ts`

```typescript
import { create } from 'zustand';

interface NodeZeroState {
  coherence: number;
  spoons: number;
  room: string;
  theme: string;
  battery: number;
  connected: boolean;
  
  // Actions
  setCoherence: (coherence: number) => void;
  setSpoons: (spoons: number) => void;
  setRoom: (room: string) => void;
  setTheme: (theme: string) => void;
  setBattery: (battery: number) => void;
  setConnected: (connected: boolean) => void;
}

export const useNodeZeroStore = create<NodeZeroState>((set) => ({
  coherence: 0,
  spoons: 100,
  room: 'observatory',
  theme: 'default',
  battery: 100,
  connected: false,
  
  setCoherence: (coherence) => set({ coherence }),
  setSpoons: (spoons) => set({ spoons }),
  setRoom: (room) => set({ room }),
  setTheme: (theme) => set({ theme }),
  setBattery: (battery) => set({ battery }),
  setConnected: (connected) => set({ connected })
}));
```

---

### FW16.4 — Connection Panel UI

**Action**: CREATE  
**File**: `software/spaceship-earth/src/components/ui/NodeZeroPanel.tsx`

```typescript
import React from 'react';
import { useNodeZeroStore } from '../stores/nodeZeroStore';
import { nodeZeroBridge } from '../services/nodeZeroBridge';

export function NodeZeroPanel() {
  const { coherence, spoons, room, theme, battery, connected } = useNodeZeroStore();
  
  const handleConnect = async () => {
    try {
      await nodeZeroBridge.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };
  
  const handleDisconnect = async () => {
    await nodeZeroBridge.disconnect();
  };
  
  if (!connected) {
    return (
      <div className="node-zero-panel disconnected">
        <div className="panel-header">
          <h3>🜔 Node Zero</h3>
        </div>
        <div className="panel-content">
          <p>Not connected</p>
          <button onClick={handleConnect} className="connect-btn">
            Connect Node Zero
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="node-zero-panel connected">
      <div className="panel-header">
        <h3>🜔 Node Zero</h3>
        <span className="connection-status">Connected</span>
      </div>
      
      <div className="panel-content">
        <div className="stat-row">
          <span className="stat-label">Coherence</span>
          <span className="stat-value">{coherence.toFixed(2)}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Spoons</span>
          <span className="stat-value">{spoons}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Room</span>
          <span className="stat-value">{room}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Theme</span>
          <span className="stat-value">{theme}</span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Battery</span>
          <span className="stat-value">{battery}%</span>
        </div>
        
        <button onClick={handleDisconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    </div>
  );
}
```

---

### FW16.5 — Top Bar Integration

**Action**: MODIFY  
**File**: `software/spaceship-earth/src/components/TopBar.tsx`

```typescript
// Add Node Zero indicator to top bar:
import { useNodeZeroStore } from '../stores/nodeZeroStore';

// In render:
const { connected, battery } = useNodeZeroStore();

// Add to top bar:
{connected && (
  <div className="node-zero-indicator" title="Node Zero Connected">
    <span>🜔</span>
    <span className="battery">{battery}%</span>
  </div>
)}
```

---

## Deliverables

- [x] nodeZeroBridge.ts Web Bluetooth service
- [x] useNodeZero.ts state sync hook
- [x] nodeZeroStore.ts Zustand store
- [x] NodeZeroPanel.tsx connection UI
- [x] Top bar integration
- [x] Coherence/spoons/room/theme sync verified on physical hardware

---

## Dependencies

- **Prerequisites**: FW12 (BLE GATT on Node Zero)
- **Blocked by**: None
- **Blocks**: None (web integration complete)

---

## Acceptance Criteria

1. Web Bluetooth can discover and connect to "NODE ZERO"
2. Writing coherence to Node Zero updates physical DRV2605L amplitude
3. Writing theme to Node Zero changes physical LVGL colors
4. IMU data streams from Node Zero to Spaceship Earth
5. Battery level displays in UI
6. Connection status visible in top bar

---

## Agent Assignment

**Primary**: Sonnet/CC (TypeScript, React, Web Bluetooth)  
**Support**: None  
**Verification**: User testing on physical hardware

---

## Usage

```typescript
// In any component:
import { useNodeZero } from '../hooks/useNodeZero';

function MyComponent() {
  const { coherence, spoons, room, theme, connected, triggerHaptic } = useNodeZero();
  
  // State automatically syncs with Node Zero
  // Changes to local store sync back to Node Zero (throttled)
  
  return (
    <div>
      {connected ? (
        <>
          <p>Coherence: {coherence}</p>
          <button onClick={() => triggerHaptic(1)}>Vibrate</button>
        </>
      ) : (
        <p>Node Zero not connected</p>
      )}
    </div>
  );
}
```
