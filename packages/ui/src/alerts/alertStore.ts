/**
 * @file alertStore — Zustand store for the sovereign alert/toast layer.
 * No PII. Alerts are transient UI signals only.
 */

import { create } from 'zustand';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
  duration: number;
}

interface AlertState {
  alerts: Alert[];
  add: (message: string, type?: AlertType, duration?: number) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

let counter = 0;

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  add: (message, type = 'info', duration = 5000) => {
    const id = `alert-${Date.now()}-${counter++}`;
    set((s) => ({ alerts: [...s.alerts, { id, message, type, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  clearAll: () => set({ alerts: [] }),
}));
