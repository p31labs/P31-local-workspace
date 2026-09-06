import { create } from 'zustand';

export type Severity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  severity: Severity;
  title: string;
  message?: string;
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const AUTO_DISMISS_MS = 8000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  addNotification: (n) => {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ notifications: [...s.notifications, { ...n, id, createdAt: Date.now() }] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => get().dismissNotification(id), AUTO_DISMISS_MS);
    }
    return id;
  },
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) })),
  clearAll: () => set({ notifications: [] }),
}));

// Imperative helper for non-React callers (stores, intervals).
export function notify(n: Omit<Notification, 'id' | 'createdAt'>) {
  return useNotificationStore.getState().addNotification(n);
}
