import { generateInterface } from '@p31/interface-generator';
import type { InterfaceDescription } from '@p31/interface-generator';
import { useSpoonStore } from '../lib/arcade-core/spoonStore';

export type UigRole = 'coordinator' | 'researcher' | 'participant' | 'grant-reviewer';

// p31ca's spoon scale is 0–12; the UIG expects 0–5.
export function p31caSpoonsToUig(level: number, max = 12): number {
  return Math.max(0, Math.min(5, Math.round((level / max) * 5)));
}

export function generateArcadeInterface(opts: {
  level?: number;
  role?: UigRole;
  passport?: any;
  viewData?: Record<string, any>;
} = {}): InterfaceDescription {
  const level = opts.level ?? 4;
  const spoons = p31caSpoonsToUig(level);
  const role = opts.role ?? 'participant';
  return generateInterface({
    passport: opts.passport ?? null,
    viewData: opts.viewData ?? {},
    role,
    spoons,
  });
}

// Reactive hook: subscribes to p31ca's spoon store and returns the adaptive
// InterfaceDescription for the current cognitive state.
export function useArcadeUIG(role?: UigRole, passport?: any, viewData?: Record<string, any>) {
  const store = useSpoonStore();
  const level = store.level;
  const spoons = p31caSpoonsToUig(level);
  const description = generateArcadeInterface({ level, role, passport, viewData });
  return { description, spoons, level };
}
