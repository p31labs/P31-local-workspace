import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TelemetryData {
  hvac_temp: number;
  power_draw_kw: number;
  ambient_lux: number;
  mesh_status: string;
}

type WsState = 'idle' | 'connecting' | 'connected' | 'dropped' | 'backoff' | 'failed';

interface WsStateMachine {
  state: WsState;
  retryCount: number;
  nextRetryMs: number;
}

const INITIAL_STATE: WsStateMachine = { state: 'idle', retryCount: 0, nextRetryMs: 0 };
const MAX_RETRIES = 10;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const TELEMETRY_BUFFER_SIZE = 500;
const UI_THROTTLE_MS = 100; // 10fps max UI updates

function calcBackoff(retryCount: number): number {
  const exp = Math.min(retryCount, 6);
  const base = BASE_RETRY_MS * Math.pow(2, exp);
  return Math.min(base, MAX_RETRY_MS);
}

export function NodeZeroSurface({ theme, spoons }: { theme: Record<string, string>; spoons: number }) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [wsState, setWsState] = useState<WsState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const bufferRef = useRef<TelemetryData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const throttleRef = useRef(0);
  const mounted = useRef(true);

  const updateUI = useCallback((telemetry: TelemetryData) => {
    const now = Date.now();
    if (now - throttleRef.current < UI_THROTTLE_MS) return;
    throttleRef.current = now;

    bufferRef.current.push(telemetry);
    if (bufferRef.current.length > TELEMETRY_BUFFER_SIZE) {
      bufferRef.current = bufferRef.current.slice(-TELEMETRY_BUFFER_SIZE);
    }

    if (mounted.current) {
      setData(telemetry);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!mounted.current) return;
      setWsState('connecting');

      try {
        ws = new WebSocket('ws://node-zero.local:81');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mounted.current) { ws?.close(); return; }
          setWsState('connected');
          setRetryCount(0);
        };

        ws.onmessage = (event) => {
          if (!mounted.current) return;
          try {
            const parsed = JSON.parse(event.data);
            updateUI(parsed);
          } catch {
            /* malformed — skip */
          }
        };

        ws.onclose = () => {
          if (!mounted.current) return;
          wsRef.current = null;

          setRetryCount((prev) => {
            const next = prev + 1;
            if (next > MAX_RETRIES) {
              setWsState('failed');
              return prev;
            }
            const backoff = calcBackoff(next);
            setWsState('backoff');
            retryTimer = setTimeout(connect, backoff);
            return next;
          });
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (mounted.current) {
          setWsState('dropped');
          const backoff = calcBackoff(1);
          retryTimer = setTimeout(connect, backoff);
        }
      }
    }

    connect();

    return () => {
      mounted.current = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) { ws.onclose = null; ws.close(); }
      wsRef.current = null;
    };
  }, [updateUI]);

  const statusLabel = {
    idle: 'IDLE',
    connecting: 'CONNECTING',
    connected: 'CONN_STABLE',
    dropped: 'CONN_DROPPING',
    backoff: 'CONN_RETRYING',
    failed: 'CONN_FAILED',
  }[wsState];

  const statusColor = wsState === 'connected' ? 'text-emerald-400' : wsState === 'failed' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">Node Zero Bridge</span>
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusColor} border-current/20 bg-current/5`}>
          {statusLabel}
        </span>
      </div>

      {retryCount > 0 && wsState !== 'connected' && (
        <div className="text-[10px] font-mono text-amber-400/60">
          Retry {retryCount}/{MAX_RETRIES} — backoff {calcBackoff(retryCount)}ms
        </div>
      )}

      {!data && wsState !== 'failed' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-xs font-mono opacity-40 tracking-widest uppercase">DISCOVERING</span>
          <p className="text-[10px] font-mono opacity-30">Scanning local network for ESP32-S3 bridge.</p>
        </div>
      )}

      {wsState === 'failed' && (
        <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-xl">
          <p className="text-xs font-mono text-red-400">Connection failed after {MAX_RETRIES} retries.</p>
          <p className="text-[10px] font-mono text-red-400/60 mt-1">Ensure device is powered on and node-zero.local resolves.</p>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">HVAC_TEMP:</span>
              <span className="text-lg font-mono">{data.hvac_temp}°F</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">LOAD_DRAW:</span>
              <span className="text-lg font-mono">{data.power_draw_kw}kW</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">LIGHT_LUX:</span>
              <span className="text-lg font-mono">{data.ambient_lux} lx</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">MESH_STAT:</span>
              <span className="text-lg font-mono text-emerald-400">{data.mesh_status}</span>
            </div>
          </div>

          <div className="text-[9px] font-mono opacity-20 text-center pt-2">
            Buffer: {bufferRef.current.length}/{TELEMETRY_BUFFER_SIZE} samples | UI throttled to 10fps
          </div>
        </>
      )}
    </div>
  );
}
