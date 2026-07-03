/**
 * Constitutional DAO — Sovereign Governance Types
 * One Person, One Vote — DID-Verified
 */

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'failed' | 'executed' | 'expired';
export type VoteChoice = 'YES' | 'NO' | 'ABSTAIN';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  status: ProposalStatus;
  createdAt: number;
  votingEndsAt: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  supermajority: number;
  action: ConstitutionalAction;
  executionHash?: string;
  executedAt?: number;
}

export interface ConstitutionalAction {
  type: 'AMEND_CONSTITUTION' | 'CHANGE_QUORUM' | 'CHANGE_SUPERMAJORITY' | 'REMOVE_PARTICIPANT' | 'ADD_PARTICIPANT';
  target: string;
  value: any;
  description: string;
}

export interface Vote {
  proposalId: string;
  voterDid: string;
  choice: VoteChoice;
  signature: string;
  timestamp: number;
}

export interface Delegate {
  did: string;
  delegatedTo: string;
  delegatedAt: number;
  expiresAt: number;
  signature: string;
}

export interface GovernanceState {
  constitution: Constitution;
  proposals: Proposal[];
  votes: Vote[];
  delegates: Delegate[];
  activeVoters: string[];
}

export interface Constitution {
  version: string;
  votingRules: {
    quorum: number;
    supermajority: number;
    votingPeriodDays: number;
    minMembershipDays: number;
  };
  amendmentHistory: Array<{
    proposalId: string;
    timestamp: number;
    description: string;
  }>;
}
