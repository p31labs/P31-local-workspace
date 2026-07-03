import React, { useState, useEffect } from 'react';
import { PGliteProvider as OfficialPGliteProvider } from '@electric-sql/pglite-react';
import { initDb, getDb } from '../lib/pglite';

export function PGliteProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    initDb()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-xs font-mono opacity-50 mb-2">ERR_DB_INIT</div>
          <div className="text-sm opacity-70 font-light">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!ready) return null;

  const db = getDb()!;
  return (
    <OfficialPGliteProvider db={db as any}>
      {children}
    </OfficialPGliteProvider>
  );
}
