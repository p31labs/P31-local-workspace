/**
 * COGPASS_CONSUMER_REGISTRY — Cognitive Passport field consumer map.
 *
 * Lists every system that reads CogPass fields. When the passport schema
 * gains a new field, check each consumer in this registry and update its
 * field list or mark it as "not-applicable".
 *
 * Used by: verify:cognitive-passport-schema (future WCD-COGPASS-02 extension)
 *
 * @see docs/P31-COGPASS-SCHEMA-ALIGNMENT.md §4
 */

export type CogPassFieldGroup =
  | 'subject'
  | 'diagnoses'
  | 'cognitive_profile'
  | 'communication'
  | 'accessibility'
  | 'products'
  | 'legal'
  | 'financial'
  | 'ai_allocation'
  | 'daily_schedule'
  | 'influences'
  | 'medications';

export interface CogPassConsumer {
  /** Human-readable name of the consuming system */
  name: string;
  /** Repository path or package name of the consumer */
  location: string;
  /** CogPass field groups this consumer reads */
  reads: CogPassFieldGroup[];
  /** Notes on how the consumer uses these fields */
  notes?: string;
}

export const COGPASS_CONSUMER_REGISTRY: CogPassConsumer[] = [
  {
    name: 'p31-subject-prefs.js',
    location: 'andromeda/software/p31ca/public/lib/p31-subject-prefs.js',
    reads: ['accessibility'],
    notes: 'localStorage → CSS custom properties → every P31 surface',
  },
  {
    name: 'SoupEngine.parseLocalRunbook()',
    location: 'src/soup.ts',
    reads: ['cognitive_profile', 'accessibility'],
    notes: 'localRunbook payload injected via bonding-relay KV polling',
  },
  {
    name: 'SIMPLEX STEWARD agent',
    location: 'simplex-v7/src/agents/steward.ts',
    reads: ['daily_schedule', 'financial'],
    notes: 'Initializes spoon budget and shift schedule from passport state',
  },
  {
    name: 'SIMPLEX MEDIC agent',
    location: 'simplex-v7/src/agents/medic.ts',
    reads: ['diagnoses', 'medications'],
    notes: 'Med schedule, calcium gap detection, Ca²⁺ alert thresholds',
  },
  {
    name: 'SIMPLEX ORACLE agent',
    location: 'simplex-v7/src/agents/oracle.ts',
    reads: ['cognitive_profile', 'influences'],
    notes: 'Q-Factor vertex weighting, influence graph construction',
  },
  {
    name: 'k4-personal Worker',
    location: 'andromeda/software/k4-personal/',
    reads: ['subject', 'communication', 'ai_allocation'],
    notes: 'Agent personality, response style, and AI triad lane assignments',
  },
  {
    name: 'Spaceship Earth (dome)',
    location: 'andromeda/software/p31ca/src/scripts/dome-cockpit.ts',
    reads: ['accessibility', 'cognitive_profile'],
    notes: 'Dome appearance defaults, room routing, safe mode triggers',
  },
  {
    name: 'Hub cards (p31ca)',
    location: 'andromeda/software/p31ca/src/data/hub-landing.json',
    reads: ['products'],
    notes: 'Product status indicators and surface availability',
  },
  {
    name: 'Legal document generator',
    location: 'scripts/office-generate.mjs',
    reads: ['legal', 'financial', 'subject'],
    notes: 'Court filing templates, COI forms, board resolutions',
  },
];

/** Look up all consumers that read a given field group. */
export function consumersOf(field: CogPassFieldGroup): CogPassConsumer[] {
  return COGPASS_CONSUMER_REGISTRY.filter(c => c.reads.includes(field));
}

/** All field groups that have at least one registered consumer. */
export const CONSUMED_FIELD_GROUPS: Set<CogPassFieldGroup> = new Set(
  COGPASS_CONSUMER_REGISTRY.flatMap(c => c.reads),
);
