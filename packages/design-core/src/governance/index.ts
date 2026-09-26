/**
 * @file Governance components — the visual vocabulary of the audit/agent layer.
 * All components use P31 on-disk tokens (GOVERNANCE from math/colors) — no
 * hardcoded hex in production code.
 */

export { ChainTimeline } from './ChainTimeline.js';
export type { ChainEvent, ChainTimelineProps } from './ChainTimeline.js';
export { VerifyButton } from './VerifyButton.js';
export type { VerifyResult, VerifyButtonProps } from './VerifyButton.js';
export { EnforcementGauge } from './EnforcementGauge.js';
export type { EnforcementMode, EnforcementGaugeProps } from './EnforcementGauge.js';
export { RefusalFeed } from './RefusalFeed.js';
export type { Refusal, RefusalReason, RefusalFeedProps } from './RefusalFeed.js';
export { ProposalQueue } from './ProposalQueue.js';
export type { Proposal, ProposalQueueProps } from './ProposalQueue.js';
export { SovereignBadge } from './SovereignBadge.js';
export type { SyncState, SovereignBadgeProps } from './SovereignBadge.js';
export { LumiIdentityCard } from './LumiIdentityCard.js';
export type { LumiScope, LumiIdentityCardProps } from './LumiIdentityCard.js';