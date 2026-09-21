/**
 * The music maker — MusicZone domain model.
 *
 * NOT the same concept as @p31/field's registry "zones" (the K₄ subgraphs).
 * The build prompt's §1 audit names the conflation explicitly: these are
 * spatial *musical* zones — a note at a position on the sphere. The decay/
 * pressure math from @p31/field IS reused (§5.4) for the "played note glows,
 * then cools" feedback, but the domain type is distinct and named MusicZone.
 */

import { decay, type Trace } from '@p31/field';

export type Timbre = 'hydrogen' | 'carbon' | 'oxygen' | 'phosphor';

export interface MusicZone {
  id: string;
  position: [number, number, number];
  timbre: Timbre;
  name: string;
}

export interface TriggerTrace {
  zone: string;
  ts: number;
  actor: string;
}

/**
 * The "played note glows" pressure — the same exponential decay curve the
 * rest of the system's "reading is writing" visuals use. A struck zone's
 * glow = sum of decayed recent triggers. (decay(trace, atMs, halfLife))
 */
export function zoneGlow(trace: TriggerTrace, atMs: number, halfLifeMs = 1400): number {
  const t: Trace = {
    actor: trace.actor,
    zone: trace.zone,
    frame: 'rhythm',
    kind: 'trigger',
    payload: {},
    preImage: '',
    postImage: '',
    coherence: 'in-lane',
    ts: trace.ts,
  };
  return decay(t, atMs, halfLifeMs);
}

/**
 * Phyllotaxis-sphere placement — the golden-angle spiral the Jitterbug uses
 * for its field zones. Deterministic per index; reused rather than reinvented
 * (§5.3). Used for default/unplaced slots; an explicit human-placed position
 * wins over this.
 */
export function phyllotaxisPosition(index: number, count: number, radius: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (count - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * index;
  return [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius];
}

export function makeZone(id: string, position: [number, number, number], timbre: Timbre = 'hydrogen', name = ''): MusicZone {
  return { id, position, timbre, name: name || id };
}