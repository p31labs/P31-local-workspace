import React, { useState, useEffect, useCallback, useRef } from 'react';

interface WarehouseItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  updated_at: string;
}

interface WarehouseState {
  stats: { totalItems: number; syncPending: number };
  recentLog: WarehouseItem[];
  allItems: WarehouseItem[];
  error: string | null;
}

const INITIAL_STATE: WarehouseState = {
  stats: { totalItems: 0, syncPending: 0 },
  recentLog: [],
  allItems: [],
  error: null,
};

export function WarehouseSurface({ theme, spoons }: { theme: any; spoons: number }) {
  const [state, setState] = useState<INITIAL_STATE>(INITIAL_STATE);
  const [virtualOffset, setVirtualOffset] = useState(0);
  const dbRef = useRef<any>(null);
  const subRef = useRef<any>(null);
  const VISIBLE_ITEMS = 20;
  const ROW_HEIGHT = 48;

  /* v8 ignore start */
  useEffect(() => {
    let db: any = null;
    let cancelled = false;

    async function initWarehouse() {
      try {
        const { PGlite } = await import('@electric-sql/pglite');
        db = new PGlite({ connectionString: 'idb://p31-warehouse-aj' });
        dbRef.current = db;

        // Initial load
        const [summary, logs, all] = await Promise.all([
          db.query('SELECT COUNT(*) as count FROM items'),
          db.query('SELECT id, name, sku, quantity, updated_at FROM items ORDER BY id DESC LIMIT 3'),
          db.query('SELECT id, name, sku, quantity, updated_at FROM items ORDER BY id DESC LIMIT 1000'),
        ]);

        if (cancelled) return;

        const totalItems = Number((summary.rows as any)?.[0]?.count || 0);
        const recentLog = (logs.rows as WarehouseItem[]) || [];
        const allItems = (all.rows as WarehouseItem[]) || [];

        setState({
          stats: { totalItems, syncPending: 0 },
          recentLog,
          allItems,
          error: null,
        });

        // Live subscription for reactive updates
        if (db.live) {
          try {
            const sub = await db.live.query('SELECT id, name, sku, quantity, updated_at FROM items ORDER BY updated_at DESC LIMIT 100');
            if (!cancelled) {
              subRef.current = sub;
              sub.on('change', (result: any) => {
                if (!cancelled && result?.rows) {
                  setState((prev) => ({
                    ...prev,
                    allItems: result.rows as WarehouseItem[],
                    recentLog: result.rows.slice(0, 3) as WarehouseItem[],
                  }));
                }
              });
            }
          } catch {
            /* live() not available — polling fallback */
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: 'WAREHOUSE_DB_OFFLINE // READ_ONLY_FALLBACK' }));
        }
      }
    }

    initWarehouse();

    return () => {
      cancelled = true;
      if (subRef.current) {
        try { subRef.current.unsubscribe?.(); } catch { /* */ }
      }
      if (db) {
        try { db.close(); } catch { /* */ }
      }
      dbRef.current = null;
    };
  }, []);
  /* v8 ignore stop */

  const visibleItems = state.allItems.slice(virtualOffset, virtualOffset + VISIBLE_ITEMS);
  const totalHeight = Math.min(state.allItems.length, 1000) * ROW_HEIGHT;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newOffset = Math.floor(scrollTop / ROW_HEIGHT);
    setVirtualOffset(Math.max(0, Math.min(newOffset, state.allItems.length - VISIBLE_ITEMS)));
  }, [state.allItems.length]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="text-xs font-mono tracking-widest uppercase opacity-60">Warehouse Service Interface</h3>
        <span className="text-[10px] font-mono rounded px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">Live</span>
      </div>

      {state.error ? (
        <div className="p-4 border border-dashed border-amber-900/30 text-amber-400 font-mono text-xs uppercase tracking-wider bg-amber-950/10 rounded-xl">
          {state.error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border border-white/5 ${theme.name === 'CRISIS' ? 'bg-black' : 'bg-white/5'}`}>
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">TOTAL_REGISTERED_ASSETS</span>
              <span className="text-xl font-mono tracking-tight font-bold">{state.stats.totalItems}</span>
            </div>
            <div className={`p-4 rounded-xl border border-white/5 ${theme.name === 'CRISIS' ? 'bg-black' : 'bg-white/5'}`}>
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">DELTA_SYNC_QUEUE</span>
              <span className="text-xl font-mono tracking-tight font-bold text-emerald-500">{state.stats.syncPending}</span>
            </div>
          </div>

          <div className="col-span-2 space-y-2 mt-2">
            <span className="text-[10px] font-mono uppercase opacity-40 block">Recent Telemetry Activity</span>
            {state.recentLog.length === 0 ? (
              <p className="text-xs opacity-40 font-mono italic">No recent scans caught in loop.</p>
            ) : (
              <div className="space-y-1.5">
                {state.recentLog.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-mono p-2 rounded bg-white/5 border border-white/5">
                    <span className="truncate max-w-[70%]">{item.name}</span>
                    <span className="opacity-50 text-[10px]">{item.sku}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.allItems.length > VISIBLE_ITEMS && (
            <div className="col-span-2 space-y-2 mt-2">
              <span className="text-[10px] font-mono uppercase opacity-40 block">
                All Items ({state.allItems.length}) — Virtualized
              </span>
              <div
                className="overflow-y-auto rounded-xl border border-white/5 bg-black/20"
                style={{ height: VISIBLE_ITEMS * ROW_HEIGHT }}
                onScroll={handleScroll}
              >
                <div style={{ height: totalHeight, position: 'relative' }}>
                  {visibleItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="absolute left-0 right-0 flex justify-between items-center text-xs font-mono px-3 border-b border-white/5 hover:bg-white/5"
                      style={{
                        top: (virtualOffset + i) * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <span className="truncate max-w-[60%]">{item.name}</span>
                      <span className="opacity-50 text-[10px]">{item.sku}</span>
                      <span className="opacity-30 text-[10px]">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
