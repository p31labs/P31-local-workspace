export type Priority = 'low' | 'medium' | 'high';

export type RoleWorkSample = {
  wcdId: string;
  loveReward: number;
  difficulty: number;
};

export type RolePacket = {
  id: string;
  title: string;
  guild: string;
  location: string;
  priority: Priority;
  summary: string;
  tags: string[];
  monthOutcomes: { window: string; items: string[] }[];
  constraints: Record<string, string | string[]>;
  evaluationWeights: Record<string, number>;
  accommodation: string;
  workSample: RoleWorkSample;
};

export type EquityTier = {
  id: string;
  tokensRequired: number;
  equityPercent: number;
  voting: boolean;
  label: string;
  extra?: string;
};

export type RolePacketsData = {
  schema: string;
  updated: string;
  org: { id: string; name: string; equityTiers: EquityTier[] };
  roles: RolePacket[];
};

export type RubricLine = {
  id: string;
  label: string;
  weight: number;
  scale: [number, number];
  anchors?: Record<string, string>;
};

export type WorkSampleDetail = {
  title: string;
  summary: string;
  timeBoundHours: number;
  allowResourcesOverride?: string;
  deliverables: string[];
  goodLookLike: string[];
  antiPatterns: string[];
  rubric: RubricLine[];
};

export type WorkSamplesData = {
  schema: string;
  updated: string;
  defaults: { timeBoundHours: number; allowResources: string };
  samples: Record<string, WorkSampleDetail>;
};

export type Consent = {
  dataProcessing: boolean;
  shareWithReviewers: boolean;
  version: '1.0.0';
};

export type ProofArtifact = {
  id: string;
  kind: 'repo' | 'url' | 'file' | 'other';
  label: string;
  url: string;
  notes?: string;
  commitSha?: string;
};

export type ProofRecord = {
  schema: 'p31.proofRecord/1.0.0';
  id: string;
  created: string;
  updated: string;
  roleId: string;
  wcdId: string;
  consent: Consent;
  artifacts: ProofArtifact[];
  selfAssessment: Record<string, number>;
  candidateNotes: string;
};

export type HelpBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'warn' | 'legal'; text: string };

export type HelpTopic = {
  id: string;
  title: string;
  section: string;
  tags: string[];
  summary: string;
  relatedWcd: string[];
  relatedRoleId: string[];
  lastReviewed: string;
  blocks: HelpBlock[];
};

export type HelpData = { schema: string; updated: string; topics: HelpTopic[] };

export type GlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  seeAlso: string[];
};

export type GlossaryData = { schema: string; updated: string; entries: GlossaryEntry[] };

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

export type ChangelogData = { schema: string; entries: ChangelogEntry[] };

export type HashRoute = {
  name: string;
  id?: string;
  query?: string;
};
