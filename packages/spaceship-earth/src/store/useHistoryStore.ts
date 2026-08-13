import { create } from 'zustand';

export type HistoryKind = 'spoons' | 'view' | 'led' | 'node' | 'coherence';

interface HistoryEntry {
  id: number;
  kind: HistoryKind;
  label: string;
  undo: () => void;
}

interface HistoryState {
  entries: HistoryEntry[];
  isUndoing: boolean;
  record: (kind: HistoryKind, label: string, undo: () => void) => void;
  undo: () => void;
  clear: () => void;
}

const MAX_ENTRIES = 30;
let nextId = 1;

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  isUndoing: false,

  record: (kind, label, undo) =>
    set((state) => ({
      entries: [...state.entries, { id: nextId++, kind, label, undo }].slice(-MAX_ENTRIES),
    })),

  undo: () => {
    const { entries, isUndoing } = get();
    if (isUndoing || entries.length === 0) return;
    const entry = entries[entries.length - 1];
    set({ isUndoing: true });
    try {
      entry.undo();
    } finally {
      set({ isUndoing: false, entries: entries.slice(0, -1) });
    }
  },

  clear: () => set({ entries: [] }),
}));
