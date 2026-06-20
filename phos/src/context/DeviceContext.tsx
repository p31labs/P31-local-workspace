import React, { createContext, useState, useEffect, useCallback } from 'react';

export type DeviceLevel = 0 | 1 | 2 | 3 | 4;

export interface Device {
  id: string;
  name: string;
  level: DeviceLevel;
  type: 'esp32' | 'phone' | 'tablet' | 'chromebook' | 'pc';
  online: boolean;
  ip?: string;
}

interface DeviceContextValue {
  devices: Device[];
  currentDevice: Device;
  setCurrentDevice: (id: string) => void;
  isSuperposition: boolean;
  toggleSuperposition: () => void;
  inferredLevel: DeviceLevel;
}

export const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

const MOCK_DEVICES: Device[] = [
  { id: 'esp32-1', name: 'Node Zero', level: 0, type: 'esp32', online: true, ip: '192.168.1.10' },
  { id: 'phone-1', name: 'Mobile Comms', level: 1, type: 'phone', online: true, ip: '192.168.1.14' },
  { id: 'tablet-1', name: 'Field Tablet', level: 2, type: 'tablet', online: false },
  { id: 'chromebook-1', name: 'Tactical Duet', level: 3, type: 'chromebook', online: true, ip: '192.168.1.22' },
  { id: 'pc-1', name: 'P31 Studio Terminal', level: 4, type: 'pc', online: true, ip: '127.0.0.1' },
];

function getLevelFromWidth(width: number): DeviceLevel {
  if (width < 480) return 0;
  if (width < 768) return 1;
  if (width < 1024) return 2;
  if (width < 1440) return 3;
  return 4;
}

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [inferredLevel, setInferredLevel] = useState<DeviceLevel>(() =>
    typeof window !== 'undefined' ? getLevelFromWidth(window.innerWidth) : 4
  );
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(MOCK_DEVICES[4].id);
  const [isSuperposition, setIsSuperposition] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeoutId: NodeJS.Timeout;
    const handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const level = getLevelFromWidth(window.innerWidth);
        setInferredLevel(level);
        setDevices(current => {
          const match = current.find(d => d.level === level && d.online);
          if (match) {
            setCurrentDeviceId(prev => (prev === match.id ? prev : match.id));
          }
          return current;
        });
      }, 150);
    };
    window.addEventListener('resize', handler);
    handler();
    return () => {
      window.removeEventListener('resize', handler);
      clearTimeout(timeoutId);
    };
  }, []);

  const currentDevice = devices.find(d => d.id === currentDeviceId) || devices[0];
  const toggleSuperposition = useCallback(() => setIsSuperposition(prev => !prev), []);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        currentDevice,
        setCurrentDevice: setCurrentDeviceId,
        isSuperposition,
        toggleSuperposition,
        inferredLevel,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};
