import type { PassportDocument, FieldGroup, PassportProfileId } from '@p31/shared/cognitive-passport';

const DB_NAME = 'p31-passport';
const DB_VERSION = 1;
const STORE_NAME = 'passports';
const DRAFT_KEY = 'current-draft';

export interface PassportDraft {
  id: string;
  data: Partial<PassportDocument>;
  profile: PassportProfileId;
  schema_version: string;
  last_saved: number;
  completed_steps: string[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('last_saved', 'last_saved', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(id: string, data: Partial<PassportDocument>, completedSteps: string[] = []): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const draft: PassportDraft = {
    id,
    data,
    profile: (data.profile as PassportProfileId) ?? 'public',
    schema_version: data.schema_version ?? 'p31.cognitivePassport/1.1.0',
    last_saved: Date.now(),
    completed_steps: completedSteps,
  };

  store.put(draft);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraft(id: string = DRAFT_KEY): Promise<PassportDraft | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDraft(id: string = DRAFT_KEY): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listDrafts(): Promise<PassportDraft[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function exportDraft(id: string = DRAFT_KEY): Promise<PassportDocument | null> {
  const draft = await loadDraft(id);
  if (!draft) return null;

  const document: PassportDocument = {
    schema_version: draft.schema_version,
    audience_matrix_version: '1.0.0',
    profile: draft.profile,
    fields: (draft.data.fields ?? {}) as Partial<Record<FieldGroup, unknown>>,
    provenance: draft.data.provenance as PassportDocument['provenance'],
  };

  return document;
}
