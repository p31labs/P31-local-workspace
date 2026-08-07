/**
 * useWebMCP — Browser-native WebMCP tool registration for Spaceship Earth.
 *
 * Registers tools with Chrome's built-in browser agent. Accepts a config
 * ref so handlers always read the latest state without re-registering.
 *
 * WebMCP Origin Trial: Chrome 149 → 156, expires Nov 16, 2026.
 * P31 holds tokens for p31ca.org and phosphorus31.org.
 */
import { useEffect, useRef } from 'react';

declare global {
  interface Navigator {
    modelContext?: {
      registerTool(config: {
        name: string;
        description: string;
        inputSchema?: Record<string, unknown>;
        handler: (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
      }): Promise<void>;
    };
  }
}

export interface SpaceshipWebMCPConfig {
  getSpoons: () => number;
  setSpoons: (n: number) => void;
  getViewMode: () => 'DELTA' | 'POSNER';
  toggleViewMode: () => void;
  isLarmorActive: () => boolean;
  toggleLarmor: () => void;
  sendTransmission: (msg: string) => void;
  getCoherence: () => number;
}

export function useWebMCP(configRef: React.MutableRefObject<SpaceshipWebMCPConfig | null>) {
  const first = useRef(true);

  useEffect(() => {
    if (!first.current) return;
    first.current = false;

    const ctx = navigator.modelContext;
    if (!ctx?.registerTool) return;

    const register = (
      name: string,
      description: string,
      inputSchema: Record<string, unknown> | undefined,
      fn: (args: Record<string, unknown>) => Promise<string>,
    ) => {
      ctx.registerTool({
        name,
        description,
        ...(inputSchema ? { inputSchema } : {}),
        handler: async (params) => {
          const text = await fn(params);
          return { content: [{ type: 'text', text }] };
        },
      }).catch(() => {});
    };

    register(
      'ship_set_spoons',
      'Adjust the spoon level (0-5) for the spaceship. 0 triggers crisis, 4-5 enables full coherence.',
      { type: 'object', properties: { level: { type: 'number', minimum: 0, maximum: 5 } }, required: ['level'] },
      async ({ level }) => {
        const lv = Math.max(0, Math.min(5, Number(level ?? 3)));
        configRef.current?.setSpoons(lv);
        return JSON.stringify({ ok: true, spoons: lv });
      },
    );

    register(
      'ship_toggle_view',
      'Toggle the 3D view between DELTA (K4 tetrahedral dome) and POSNER (molecular mode).',
      undefined,
      async () => {
        configRef.current?.toggleViewMode();
        return JSON.stringify({ ok: true, viewMode: configRef.current?.getViewMode() });
      },
    );

    register(
      'ship_toggle_larmor',
      'Start or stop the Larmor frequency audio engine (863 Hz).',
      undefined,
      async () => {
        configRef.current?.toggleLarmor();
        return JSON.stringify({ ok: true, larmorActive: configRef.current?.isLarmorActive() });
      },
    );

    register(
      'ship_send_transmission',
      'Send a message through the Whale Channel. Fawn Guard intercepts unsafe transmissions.',
      { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      async ({ message }) => {
        configRef.current?.sendTransmission(String(message));
        return JSON.stringify({ ok: true, transmitted: true });
      },
    );

    register(
      'ship_get_coherence',
      'Read the current spaceship state: spoons, view mode, and Posner coherence score.',
      undefined,
      async () => {
        return JSON.stringify({
          spoons: configRef.current?.getSpoons(),
          viewMode: configRef.current?.getViewMode(),
          coherence: configRef.current?.getCoherence(),
          larmorActive: configRef.current?.isLarmorActive(),
        });
      },
    );
  }, []);
}
