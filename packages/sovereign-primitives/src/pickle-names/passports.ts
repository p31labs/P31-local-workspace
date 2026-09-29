/**
 * pickle-names/passports — the canonical family passports.
 *
 * Extracted byte-identical from QPJ. The street never shows a human name —
 * pickle labels only. Each passenger is a privacy-preserving identity node.
 */
export type PersonaRole = 'child' | 'senior' | 'teen' | 'adult' | 'caregiver';
export type PortalMode = 'spark' | 'maker' | 'workshop';
export type PassportId = string;

export interface Passport {
  id: PassportId;
  /** The street never shows a human name — pickle labels only. */
  pickledName: string;
  initials: string;
  emoji: string;
  role: PersonaRole;
  accentHue: number;
  birthday: string;
  favorite: string;
  blurb: string;
  isCaregiver: boolean;
}

export const PASSENGERS: Record<string, Passport> = {
  dillpickle: {
    id: 'dillpickle',
    pickledName: 'Dillpickle',
    initials: 'D',
    emoji: '🧸',
    role: 'child',
    accentHue: 75,
    birthday: '08-14',
    favorite: 'pickles and stars',
    blurb: 'Little inventor. Loves the candy store and the night garden.',
    isCaregiver: false,
  },
  breadbutter: {
    id: 'breadbutter',
    pickledName: 'Bread & Butter',
    initials: 'B',
    emoji: '🛰️',
    role: 'teen',
    accentHue: 235,
    birthday: '02-02',
    favorite: 'synthwave and synthchords',
    blurb: 'Teen tinkerer. Reads the sky, mends the radios.',
    isCaregiver: false,
  },
  cornichon: {
    id: 'cornichon',
    pickledName: 'Cornichon',
    initials: 'C',
    emoji: '🌿',
    role: 'senior',
    accentHue: 145,
    birthday: '11-30',
    favorite: 'garden breakfasts',
    blurb: 'Gramma of the green thumbs. Tends the community garden.',
    isCaregiver: false,
  },
  gherkin: {
    id: 'gherkin',
    pickledName: 'Gherkin',
    initials: 'G',
    emoji: '🌸',
    role: 'caregiver',
    accentHue: 350,
    birthday: '05-19',
    favorite: 'quilt nights',
    blurb: 'Keeps the jar stocked and the street humming.',
    isCaregiver: true,
  },
  halfsour: {
    id: 'halfsour',
    pickledName: 'Half-Sour',
    initials: 'H',
    emoji: '🚀',
    role: 'adult',
    accentHue: 285,
    birthday: '09-09',
    favorite: 'rockets and thick coffee',
    blurb: 'Builds the workshop ships. Explains things with whiteboards.',
    isCaregiver: false,
  },
};

export const PASSENGER_IDS = Object.keys(PASSENGERS);

export function getPassport(id: string): Passport {
  return PASSENGERS[id] ?? PASSENGERS.dillpickle;
}

export const ROLE_DEFAULT_MODE: Record<PersonaRole, PortalMode> = {
  child: 'spark',
  senior: 'spark',
  teen: 'maker',
  adult: 'workshop',
  caregiver: 'workshop',
};

export const MODE_RANK: Record<PortalMode, number> = {
  spark: 0,
  maker: 1,
  workshop: 2,
};

export const MODE_LABELS: Record<PortalMode, string> = {
  spark: 'Spark',
  maker: 'Maker',
  workshop: 'Workshop',
};

export const MODE_ORDER: PortalMode[] = ['spark', 'maker', 'workshop'];

export function canAccess(activeMode: PortalMode, requiredMode: PortalMode): boolean {
  return MODE_RANK[activeMode] >= MODE_RANK[requiredMode];
}

export function defaultModeFor(id: string): PortalMode {
  return ROLE_DEFAULT_MODE[getPassport(id).role];
}

export function clampSpoons(level: number): number {
  const n = Number.isFinite(level) ? level : 3;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** Passport invariants: unique ids, unique pickle names, one caregiver. */
export function passportInvariants(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const ids = Object.keys(PASSENGERS);
  const names = ids.map((id) => PASSENGERS[id].pickledName);
  if (new Set(ids).size !== ids.length) failures.push('duplicate passport id');
  if (new Set(names).size !== names.length) failures.push('duplicate pickle name');
  const caregivers = ids.filter((id) => PASSENGERS[id].isCaregiver);
  if (caregivers.length !== 1) failures.push(`expected exactly 1 caregiver, got ${caregivers.length}`);
  return { ok: failures.length === 0, failures };
}