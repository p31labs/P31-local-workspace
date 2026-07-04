import type { PassportDocument } from '@p31/shared/cognitive-passport';

export interface AutoSaveOptions {
  key: string;
  delay: number;
  onSave?: (timestamp: number) => void;
  onError?: (error: Error) => void;
}

export function createAutoSaver(opts: AutoSaveOptions) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastData: Partial<PassportDocument> | null = null;
  let lastSaveTime = 0;
  let saveCount = 0;

  async function save(data: Partial<PassportDocument>, completedSteps: string[] = []) {
    const { saveDraft } = await import('./index');
    try {
      await saveDraft(opts.key, data, completedSteps);
      lastSaveTime = Date.now();
      saveCount++;
      opts.onSave?.(lastSaveTime);
    } catch (err) {
      opts.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  return {
    schedule(data: Partial<PassportDocument>, completedSteps: string[] = []) {
      lastData = data;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => save(data, completedSteps), opts.delay);
    },

    flush(): Promise<void> {
      if (timeout) clearTimeout(timeout);
      timeout = null;
      if (lastData) return save(lastData) as unknown as Promise<void>;
      return Promise.resolve();
    },

    getStats() {
      return { lastSaveTime, saveCount, pending: timeout !== null };
    },

    destroy() {
      if (timeout) clearTimeout(timeout);
      timeout = null;
      lastData = null;
    },
  };
}

export type AutoSaver = ReturnType<typeof createAutoSaver>;
