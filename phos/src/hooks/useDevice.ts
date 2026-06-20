import { useContext } from 'react';
import { DeviceContext } from '../../../software/cloudflare-worker/{project}/command-center/src/cloud-hub-html.js';

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return ctx;
}
