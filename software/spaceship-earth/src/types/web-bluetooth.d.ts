/** Minimal Web Bluetooth Scanning API type declarations (experimental). */

interface BluetoothLEScanOptions {
  filters?: BluetoothLEScanFilter[];
  acceptAllAdvertisements?: boolean;
  signal?: AbortSignal;
}

interface BluetoothLEScanFilter {
  services?: string[];
  name?: string;
  namePrefix?: string;
}

interface Bluetooth extends EventTarget {
  requestLEScan?(options?: BluetoothLEScanOptions): Promise<void>;
  addEventListener(type: 'advertisementreceived', listener: (event: BluetoothAdvertisingEvent) => void): void;
  removeEventListener(type: 'advertisementreceived', listener: (event: BluetoothAdvertisingEvent) => void): void;
}

interface BluetoothAdvertisingEvent extends Event {
  device: { id: string; name?: string };
  rssi: number;
  manufacturerData?: Map<number, DataView>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
