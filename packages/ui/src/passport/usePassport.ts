/**
 * @file usePassport — React hook to load the Cognitive Passport bundle from
 * IndexedDB and expose create/export/import/reset actions.
 *
 * Sovereign, local-first. No telemetry of PII; events (if wired) carry only
 * event names, never identity content.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CognitivePassport } from './schema';
import type { Ed25519Identity } from './identity';
import {
  clearPassport,
  exportBundle,
  importBundle,
  loadBundle,
  saveIdentity,
  savePassport,
  type StoredBundle,
  type StoredIdentity,
} from './store';
import { generateEd25519Identity, identityFromPrivateJwk } from './identity';
import { withFace } from './face';
import { trackUiEvent } from '../telemetry';

export interface UsePassport {
  status: 'loading' | 'empty' | 'ready';
  bundle: StoredBundle | null;
  identity: StoredIdentity | null;
  passport: CognitivePassport | null;
  create: (draft: Omit<CognitivePassport, 'did' | 'publicKey' | 'created'>, opts?: { glow?: boolean }) => Promise<CognitivePassport>;
  update: (patch: Partial<CognitivePassport>) => Promise<CognitivePassport>;
  exportJson: () => Promise<string | null>;
  importJson: (json: string) => Promise<void>;
  reset: () => Promise<void>;
}

export function usePassport(): UsePassport {
  const [bundle, setBundle] = useState<StoredBundle | null>(null);
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready'>('loading');

  const refresh = useCallback(async () => {
    const b = await loadBundle();
    setBundle(b);
    setStatus(b ? 'ready' : 'empty');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (draft: Omit<CognitivePassport, 'did' | 'publicKey' | 'created'>, opts?: { glow?: boolean }): Promise<CognitivePassport> => {
      const id: Ed25519Identity = await generateEd25519Identity();
      await saveIdentity(id);
      const passport: CognitivePassport = withFace(
        { ...(draft as CognitivePassport), did: id.did, publicKey: id.publicKey, created: new Date().toISOString() },
        opts,
      );
      await savePassport(passport);
      await refresh();
      trackUiEvent('passport', 'created');
      return passport;
    },
    [refresh],
  );

  const update = useCallback(
    async (patch: Partial<CognitivePassport>): Promise<CognitivePassport> => {
      const current = await loadBundle();
      if (!current) throw new Error('No passport to update');
      const next: CognitivePassport = { ...current.passport, ...patch, updated: new Date().toISOString() };
      await savePassport(next);
      await refresh();
      return next;
    },
    [refresh],
  );

  const exportJson = useCallback(() => {
    trackUiEvent('passport', 'exported');
    return exportBundle();
  }, []);

  const importJson = useCallback(
    async (json: string) => {
      await importBundle(json);
      await refresh();
      trackUiEvent('passport', 'imported');
    },
    [refresh],
  );

  const reset = useCallback(async () => {
    await clearPassport();
    await refresh();
    trackUiEvent('passport', 'reset');
  }, [refresh]);

  return {
    status,
    bundle,
    identity: bundle?.identity ?? null,
    passport: bundle?.passport ?? null,
    create,
    update,
    exportJson,
    importJson,
    reset,
  };
}

export { identityFromPrivateJwk };
