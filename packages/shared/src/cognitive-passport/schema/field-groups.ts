export const FIELD_GROUPS = [
  'pii',
  'med',
  'cog',
  'comm',
  'prof',
  'fam',
  'org',
  'leg',
  'ben',
  'fin',
  'work',
  'vault',
  'comms',
  'sched',
  'lex',
  'agt',
  'sent',
  'gen',
] as const;

export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  pii: 'Personal Identifiers',
  med: 'Medical / Health',
  cog: 'Cognitive & Sensory Profile',
  comm: 'Communication Preferences',
  prof: 'Professional / Vocational',
  fam: 'Family & Relationships',
  org: 'Organizational Memberships',
  leg: 'Legal & Consent',
  ben: 'Benefits & Entitlements',
  fin: 'Financial',
  work: 'Work / Productivity',
  vault: 'Private Vault',
  comms: 'Communications (External)',
  sched: 'Daily Schedule & Rhythms',
  lex: 'Lexicon & Language',
  agt: 'Agent Configuration',
  sent: 'Sentinel Data',
  gen: 'Genesis / Provenance',
};

export const FIELD_GROUP_DESCRIPTIONS: Record<FieldGroup, string> = {
  pii: 'Name, DOB, pronouns, contact info, identifiers',
  med: 'Diagnoses, medications, allergies, care team',
  cog: 'Neurotype, sensory thresholds, executive function patterns',
  comm: 'Modality preferences, bandwidth spoons, communication protocols',
  prof: 'Job title, skills, education, professional history',
  fam: 'Relationship graph, roles, nicknames, care relationships',
  org: 'Organizations, memberships, affiliations',
  leg: 'Consent flags, legal documents, court case references',
  ben: 'SSA, VA, insurance, benefits enrollment',
  fin: 'Financial accounts, budgets, funding sources',
  work: 'Work style, productivity patterns, accommodation needs',
  vault: 'Private fields — encrypted at rest, user-only access',
  comms: 'Email, phone, social media, messaging preferences',
  sched: 'Daily rhythms, availability windows, custody schedule',
  lex: 'Preferred terminology, triggers, language settings',
  agt: 'AI agent personality, trust thresholds, lane assignments',
  sent: 'Sentinel health metrics, crisis flags, emergency contacts',
  gen: 'Passport version, genesis hash, creation timestamp',
};

export const PROFILE_IDS = [
  'cursor-agent',
  'claude-session',
  'clinician',
  'ssa',
  'court',
  'ada-support',
  'beta',
  'child',
  'grant-reviewer',
  'public',
  'sentinel',
  'family',
] as const;

export type PassportProfileId = (typeof PROFILE_IDS)[number];

export const PROFILE_LABELS: Record<PassportProfileId, string> = {
  'cursor-agent': 'Cursor / Coding Agent',
  'claude-session': 'Claude / AI Session',
  'clinician': 'Clinician / Provider',
  'ssa': 'Social Security Administration',
  'court': 'Court / Legal',
  'ada-support': 'ADA Support / Advocate',
  'beta': 'Beta Tester / Early Adopter',
  'child': 'Child / Dependent',
  'grant-reviewer': 'Grant Reviewer',
  'public': 'Public / General',
  'sentinel': 'Sentinel / Health Monitor',
  'family': 'Family / Close Circle',
};

export const FIELD_GROUP_MESH_GATED: FieldGroup[] = ['vault', 'sent'];
export const PROFILE_MESH_GATED: PassportProfileId[] = ['child'];

export const SCHEMA_VERSION = 'p31.cognitivePassport/1.1.0' as const;
export const AUDIENCE_MATRIX_VERSION = '1.0.0' as const;
