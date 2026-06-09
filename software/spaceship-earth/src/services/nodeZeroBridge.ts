/**
 * @file nodeZeroBridge.ts
 * @brief Web Bluetooth service for Node Zero communication
 * 
 * P31 Labs - Spaceship Earth - Node Zero Bridge
 * WCD-FW16: Spaceship Earth Client Bridge
 * 
 * Connects to Node Zero via Web Bluetooth and syncs state
 * bidirectionally: SE ↔ Node Zero
 */

// P31 Service UUID: 31500000-P31L-4ABS-CAFE-CA9PO4630000
// Encodes: P31 Labs + Ca₉(PO₄)₆ + Posner molecule
const P31_SERVICE_UUID = '31500000-7033-314c-cafe-ca9504630000';

// Characteristic UUIDs
const CHAR_COHERENCE_UUID = '31500001-7033-314c-cafe-ca9504630000';
const CHAR_SPOONS_UUID = '31500002-7033-314c-cafe-ca9504630000';
const CHAR_ROOM_UUID = '31500003-7033-314c-cafe-ca9504630000';
const CHAR_THEME_UUID = '31500004-7033-314c-cafe-ca9504630000';
const CHAR_IMU_UUID = '31500005-7033-314c-cafe-ca9504630000';
const CHAR_BATTERY_UUID = '31500006-7033-314c-cafe-ca9504630000';
const CHAR_HAPTIC_CMD_UUID = '31500007-7033-314c-cafe-ca9504630000';
const CHAR_DID_UUID = '31500008-7033-314c-cafe-ca9504630000';

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
  
  private _connected = false;
  get connected(): boolean {
    return this._connected;
  }
  
  /**
   * Request device connection via Web Bluetooth
   * Includes graceful error handling for unsupported browsers/platforms
   */
  async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Web Bluetooth is available
      if (!navigator.bluetooth) {
        return { 
          success: false, 
          error: 'Web Bluetooth is not supported in this browser. Use Chrome or Edge on desktop, or Chrome on Android.' 
        };
      }
      
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
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NodeZeroBridge] Connection failed:', errorMessage);
      
      // Provide specific error messages for common issues
      let userMessage = 'Failed to connect to Node Zero';
      if (errorMessage.includes('Bluetooth')) {
        userMessage = 'Bluetooth is not available. Please enable Bluetooth on your device.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('No device')) {
        userMessage = 'Node Zero not found. Make sure the device is powered on and in range.';
      } else if (errorMessage.includes('User cancelled') || errorMessage.includes('cancelled')) {
        userMessage = 'Connection cancelled. Please try again.';
      }
      
      return { success: false, error: userMessage };
    }
  }
  
  private async setupCharacteristics(): Promise<void> {
    if (!this.service) return;
    
    // Get all characteristics
    this.coherenceChar = await this.service.getCharacteristic(CHAR_COHERENCE_UUID);
    this.spoonsChar = await this.service.getCharacteristic(CHAR_SPOONS_UUID);
    this.roomChar = await this.service.getCharacteristic(CHAR_ROOM_UUID);
    this.themeChar = await this.service.getCharacteristic(CHAR_THEME_UUID);
    this.imuChar = await this.service.getCharacteristic(CHAR_IMU_UUID);
    this.batteryChar = await this.service.getCharacteristic(CHAR_BATTERY_UUID);
    this.hapticChar = await this.service.getCharacteristic(CHAR_HAPTIC_CMD_UUID);
    this.didChar = await this.service.getCharacteristic(CHAR_DID_UUID);
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
        const room = decoder.decode(view).replace(/\0/g, '');
        this.onStateChange?.({ room });
      });
    }
    
    // Subscribe to theme notifications
    if (this.themeChar) {
      await this.themeChar.startNotifications();
      this.themeChar.addEventListener('characteristicvaluechanged', (e) => {
        const view = (e.target as BluetoothRemoteGATTCharacteristic).value!;
        const decoder = new TextDecoder();
        const theme = decoder.decode(view).replace(/\0/g, '');
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
