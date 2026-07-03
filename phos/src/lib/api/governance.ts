import { endpoints } from '../../config/endpoints';
import { signedFetch } from '../api/signer';
import type { Proposal, Constitution, VoteChoice, Delegate } from '../governance/types';

export interface GovernanceApiProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  author: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  supermajority: number;
  createdAt: number;
  votingEndsAt: number;
  actionType?: string;
  actionTarget?: string;
  actionValue?: string;
  actionDescription?: string;
  executionHash?: string;
  executedAt?: number;
}

export interface TallyResult {
  proposalId: string;
  rawVotes: { for: number; against: number; abstain: number; total: number };
  weightedVotes: { for: number; against: number; abstain: number };
  totalWeighted: number;
}

function mapProposal(p: GovernanceApiProposal): Proposal {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    author: p.author,
    status: p.status as Proposal['status'],
    createdAt: p.createdAt,
    votingEndsAt: p.votingEndsAt,
    votesFor: p.votesFor,
    votesAgainst: p.votesAgainst,
    votesAbstain: p.votesAbstain,
    totalVotes: p.totalVotes,
    quorum: p.quorum,
    supermajority: p.supermajority,
    action: {
      type: (p.actionType as Proposal['action']['type']) || 'AMEND_CONSTITUTION',
      target: p.actionTarget || 'general',
      value: p.actionValue || '',
      description: p.actionDescription || p.description,
    },
    executionHash: p.executionHash,
    executedAt: p.executedAt,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let error = text;
    try {
      const json = JSON.parse(text);
      error = json.error || text;
    } catch { /* not json */ }
    throw new Error(error);
  }
  return res.json();
}

export async function fetchProposals(status = 'all'): Promise<Proposal[]> {
  const url = new URL(`${endpoints.governanceEngine}/proposals`);
  if (status !== 'all') url.searchParams.set('status', status);
  const resp = await fetch(url.toString());
  const data = await handleResponse<{ proposals: GovernanceApiProposal[] }>(resp);
  return data.proposals.map(mapProposal);
}

export async function fetchConstitution(): Promise<Constitution> {
  const resp = await fetch(`${endpoints.governanceEngine}/constitution`);
  const data = await handleResponse<{ constitution: any }>(resp);
  return data.constitution;
}

export async function createProposal(input: {
  title: string;
  description: string;
  author: string;
  actionType?: string;
  actionTarget?: string;
  actionValue?: string;
  actionDescription?: string;
}): Promise<Proposal> {
  const data = await handleResponse<{ proposal: GovernanceApiProposal }>(
    await signedFetch(
      `${endpoints.governanceEngine}/proposal`,
      { method: 'POST', body: JSON.stringify(input) },
      'author'
    )
  );
  return mapProposal(data.proposal);
}

export async function activateProposal(proposalId: string): Promise<void> {
  await handleResponse(
    await signedFetch(
      `${endpoints.governanceEngine}/proposal/activate`,
      { method: 'POST', body: JSON.stringify({ proposalId }) },
      'author'
    )
  );
}

export async function castVote(input: {
  proposalId: string;
  voterDid: string;
  choice: VoteChoice;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; idempotent?: boolean }> {
  const res = await signedFetch(
    `${endpoints.governanceEngine}/vote`,
    {
      method: 'POST',
      body: JSON.stringify({
        proposalId: input.proposalId,
        voterDid: input.voterDid,
        choice: input.choice.toLowerCase() as 'for' | 'against' | 'abstain',
        idempotencyKey: input.idempotencyKey,
      }),
    },
    'voterDid'
  );
  if (res.status === 400) {
    const text = await res.text();
    if (text.includes('Already voted')) {
      return { ok: false, idempotent: false };
    }
  }
  return handleResponse(res);
}

export async function delegateVote(input: {
  delegatorDid: string;
  delegateDid: string;
  expiresAt?: number;
}): Promise<void> {
  await handleResponse(
    await signedFetch(
      `${endpoints.governanceEngine}/delegate`,
      { method: 'POST', body: JSON.stringify(input) },
      'delegatorDid'
    )
  );
}

export async function fetchTally(proposalId: string): Promise<TallyResult> {
  const resp = await fetch(`${endpoints.governanceEngine}/proposals/${encodeURIComponent(proposalId)}/tally`);
  const data = await handleResponse<TallyResult>(resp);
  return data;
}

export async function resolveProposal(proposalId: string): Promise<{
  status: string;
  quorumMet: boolean;
  supermajorityMet: boolean;
  execution?: any;
}> {
  const data = await handleResponse<{
    status: string;
    quorumMet: boolean;
    supermajorityMet: boolean;
    execution?: any;
  }>(
    await signedFetch(
      `${endpoints.governanceEngine}/proposal/resolve`,
      { method: 'POST', body: JSON.stringify({ proposalId }) },
      'author'
    )
  );
  return data;
}

export async function executeProposal(proposalId: string): Promise<{
  status: string;
  execution: any;
}> {
  const data = await handleResponse<{
    status: string;
    execution: any;
  }>(
    await signedFetch(
      `${endpoints.governanceEngine}/execute`,
      { method: 'POST', body: JSON.stringify({ proposalId }) },
      'author'
    )
  );
  return data;
}
