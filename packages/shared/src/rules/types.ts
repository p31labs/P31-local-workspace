// ═══════════════════════════════════════════════════════
// @p31/shared — Constitution Engine Types
//
// Three-tiered law system: Prime Directives (immutable),
// Global Rules (community consensus), Creator Rules (zone-specific).
// Creator Rules can be MORE restrictive than Global Rules but NEVER
// less restrictive.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import { ZoneEnergy } from '../zui/types';

export enum RuleTier {
  PRIME_DIRECTIVE = 0,  // Immutable. Cannot be overridden.
  GLOBAL          = 1,  // Community consensus. Applies everywhere.
  CREATOR         = 2,  // Zone-specific. More restrictive only.
}

export type RuleOperator =
  | 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN'
  | 'CONTAINS' | 'IN' | 'BETWEEN' | 'TIME_RANGE' | 'ALWAYS';

export interface RuleCondition {
  field: string;           // 'time' | 'spoonBalance' | 'karma' | 'zoneEnergy' | ...
  operator: RuleOperator;
  value: string | number | boolean | [number, number] | string[];
  description: string;     // Human-readable explanation
}

export interface RuleAction {
  type: 'ALLOW' | 'DENY' | 'REQUIRE_ACK' | 'WARN' | 'TRANSFORM' | 'SHIELD';
  target?: string;         // What the action applies to
  parameters?: Record<string, any>;
  message: string;         // User-facing explanation
}

export interface Rule {
  id: string;
  tier: RuleTier;
  name: string;
  description: string;
  conditions: RuleCondition[];  // AND-joined
  conditionLogic: 'AND' | 'OR';
  action: RuleAction;
  priority: number;        // Within same tier, higher priority wins
  zoneId?: string;         // null for PRIME/GLOBAL, required for CREATOR
  createdBy: string;
  createdAt: number;
  enabled: boolean;
  immutable: boolean;       // true for PRIME_DIRECTIVE
}

export interface Constitution {
  primeDirectives: Rule[];  // Hardcoded, never modified
  globalRules: Rule[];      // Community-editable
  creatorRules: Map<string, Rule[]>; // Keyed by zoneId
}

export interface RuleContext {
  time: number;
  spoonBalance: number;
  karma: number;
  zoneEnergy: ZoneEnergy;
  userId: string;
  zoneId: string;
  metadata?: Record<string, unknown>;
}

export interface RuleEvaluationResult {
  allowed: boolean;
  matchedRules: Rule[];
  deniedBy?: Rule;
  warnings: string[];
  requiredAcknowledgments: string[];
  transformations: RuleAction[];  // For Cognitive Shield
}

// Conflict detection for Cognitive Shield
export type ConflictLevel = 'SAFE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface MessageAnalysis {
  originalText: string;
  conflictLevel: ConflictLevel;
  triggers: string[];         // Detected conflict patterns
  sentiment: number;          // -1 to 1
}

export interface ShieldedMessage {
  original: string;
  rewritten: string | null;   // null if no rewrite available
  conflictLevel: ConflictLevel;
  blufSummary: string;        // 1-sentence neutral summary
  showOriginal: boolean;      // User toggle state
  shieldTier: 1 | 2 | 3 | 4; // Which tier produced the rewrite
}

export interface CognitiveShieldConfig {
  webllmEnabled: boolean;
  webllmModel: string;        // 'Phi-3-mini-4k-instruct-q4f16_1'
  ollamaEndpoint: string;     // 'http://192.168.1.100:11434'
  ollamaModel: string;        // 'llama3.1:8b'
  conflictThreshold: number;  // 0–1, sensitivity
  autoShieldEnabled: boolean;
}

// Creator Status types
export type CreatorStatus =
  | { level: 'VISITOR'; karmaRequired: 100 }
  | { level: 'RESIDENT'; karmaRequired: 500 }
  | { level: 'CREATOR'; karmaRequired: 1000; zonesCreated: number }
  | { level: 'ARCHITECT'; karmaRequired: 5000; zonesCreated: number };

export interface UserEconomy {
  userId: string;
  spoonBudget: SpoonBudget;
  lifetimeKarma: number;     // Monotonically increasing
  creatorStatus: CreatorStatus;
  spoonTransactions: SpoonTransaction[];
  karmaAwards: KarmaAward[];
}

export interface SpoonBudget {
  grossBudget: number;        // 12 nominal
  medicationPenalty: number;  // -2 if calcium not taken
  painPenalty: number;        // -2 if pain > 5/10
  legalPenalty: number;       // -3 to -4 if court day
  emotionalPenalty: number;   // -1 to -2 if fragile
  netBudget: number;          // computed
  spent: number;
  borrowed: number;
  remaining: number;          // netBudget - spent
  tier: 'FULL' | 'MEDIUM' | 'LOW' | 'STAND_DOWN';
  lastResetTimestamp: number; // 00:00 local time
  tomorrowPenalty: number;    // borrowed * 1.5
}

export interface SpoonTransaction {
  id: string;               // crypto.randomUUID()
  timestamp: number;        // Date.now()
  type: 'SPEND' | 'BORROW' | 'REGENERATE' | 'PENALTY';
  amount: number;           // Always positive
  source: string;           // 'zone_entry' | 'wcd_session' | 'debug_session' | ...
  description: string;
  balanceAfter: number;
  hash: string;             // SHA-256 of previous hash + this record (chain)
}

export interface KarmaAward {
  id: string;
  timestamp: number;
  fromUserId: string;       // Cannot equal toUserId (enforced at store level)
  toUserId: string;
  amount: number;
  source: KarmaSource;
  workPackageId?: string;   // If awarded for work package completion
  hash: string;             // Append-only chain
}

export type KarmaSource =
  | 'MOLECULE_COMPLETE'     // 10–100 LOVE
  | 'PING_REACTION'         // 5 LOVE
  | 'BUFFER_PROCESSED'      // 3 LOVE
  | 'FAWN_GUARD_ACK'        // 10 LOVE
  | 'CALCIUM_LOGGED'        // 15 LOVE
  | 'WCD_COMPLETE'          // 25 LOVE
  | 'MEDITATION_SESSION'    // 20 LOVE
  | 'QUEST_CHAIN'           // 50 LOVE
  | 'HELP_BOARD_COMPLETE'   // 25–100 LOVE (peer-reviewed)
  | 'PEER_AWARD';           // Variable (direct peer gift)