import { DurableObject } from 'cloudflare:workers';
import { verifyRequest, unauthorizedResponse } from '../../lib/edge/verify';
import { logEvent } from '../../lib/edge/logging';
export { TallyRoom } from './tally-room';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, label = 'd1_query'): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
      }
    }
  }
  logEvent({ event: `${label}_retry_exhausted`, service: 'governance-engine', success: false, error: String(lastErr) });
  throw lastErr;
}

export interface Env {
  GOVERNANCE_ENGINE: DurableObjectNamespace;
  TALLY_ROOM: DurableObjectNamespace;
  GOVERNANCE_DB: D1Database;
}

export class GovernanceEngineDO extends DurableObject {
  constructor(state: DurableObjectState) {
    super(state);
  }

  async fetch(request: Request): Promise<Response> {
    return new Response('OK');
  }
}
export { GovernanceEngineDO as GovernanceEngine };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === 'GET' && path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'governance-engine', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && path === '/proposals') {
      try {
        const status = url.searchParams.get('status') || 'all';
        let query = 'SELECT id, title, description, status, author, votes_for, votes_against, votes_abstain, total_votes, quorum, supermajority, created_at, voting_ends_at FROM proposals';
        const params: any[] = [];
        if (status !== 'all') {
          query += ' WHERE status = ?';
          params.push(status);
        }
        query += ' ORDER BY created_at DESC';
        const result = await withRetry(() => env.GOVERNANCE_DB.prepare(query).bind(...params).all(), 3, 'proposals_list');
        const proposals = (result.results || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          author: p.author,
          votesFor: p.votes_for,
          votesAgainst: p.votes_against,
          votesAbstain: p.votes_abstain,
          totalVotes: p.total_votes,
          quorum: p.quorum,
          supermajority: p.supermajority,
          createdAt: p.created_at,
          votingEndsAt: p.voting_ends_at,
        }));
        return new Response(JSON.stringify({ proposals }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return errorResponse(err);
      }
    }

    if (method === 'GET' && path.startsWith('/proposals/') && path.endsWith('/tally')) {
      try {
        const proposalId = path.split('/')[2];
        const proposal = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, status, votes_for, votes_against, votes_abstain, total_votes, quorum, supermajority FROM proposals WHERE id = ?'
        ).bind(proposalId).first(), 3, 'tally_proposal_lookup');
        if (!proposal) {
          return new Response(JSON.stringify({ error: 'Proposal not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
          });
        }
        const tallyQuery = `
          WITH RECURSIVE delegation_chain AS (
            SELECT v.voter_did, v.choice AS vote_type, 1 AS depth
            FROM votes v
            WHERE v.proposal_id = ?
            UNION ALL
            SELECT d.delegate_did, dc.vote_type, dc.depth + 1
            FROM delegation_chain dc
            JOIN vote_delegations d
              ON d.delegator_did = dc.voter_did
              AND d.revoked = 0
              AND (d.expires_at IS NULL OR d.expires_at > unixepoch())
            WHERE dc.depth < 10
          )
          SELECT vote_type, COUNT(*) AS weighted_count
          FROM delegation_chain
          GROUP BY vote_type
        `;
        const tallyResult = await withRetry(() => env.GOVERNANCE_DB.prepare(tallyQuery).bind(proposalId).all(), 3, 'tally_delegation_chain');
        const counts = { for: 0, against: 0, abstain: 0 };
        (tallyResult.results || []).forEach((row: any) => {
          if (row.vote_type === 'for') counts.for = row.weighted_count;
          else if (row.vote_type === 'against') counts.against = row.weighted_count;
          else if (row.vote_type === 'abstain') counts.abstain = row.weighted_count;
        });
        const totalWeighted = counts.for + counts.against + counts.abstain;
        return new Response(JSON.stringify({
          proposalId,
          rawVotes: {
            for: proposal.votes_for,
            against: proposal.votes_against,
            abstain: proposal.votes_abstain,
            total: proposal.total_votes,
          },
          weightedVotes: counts,
          totalWeighted,
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return errorResponse(err);
      }
    }

    if (method === 'GET' && path === '/constitution') {
      try {
        const result = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT * FROM constitution ORDER BY version DESC LIMIT 1'
        ).first(), 3, 'constitution_get');
        if (!result) {
          return new Response(JSON.stringify({
            constitution: {
              version: '1.0.0',
              votingRules: { quorum: 0.2, supermajority: 0.66, votingPeriodDays: 7, minMembershipDays: 0 },
              amendmentHistory: []
            }
          }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          constitution: {
            version: result.version,
            votingRules: {
              quorum: result.quorum ?? 0.2,
              supermajority: result.supermajority ?? 0.66,
              votingPeriodDays: result.voting_period_days ?? 7,
              minMembershipDays: result.min_membership_days ?? 0,
            },
            amendmentHistory: result.amendment_history_json ? JSON.parse(result.amendment_history_json) : []
          }
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/proposal') {
      try {
        if (!await verifyRequest(request, 'author')) {
          logEvent({ event: 'proposal_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const title = body.title || '';
        const description = body.description || '';
        const author = body.author || body.proposerDid || '';
        const actionType = body.actionType || 'AMEND_CONSTITUTION';
        const actionTarget = body.actionTarget || 'general';
        const actionValue = body.actionValue || '';
        const actionDescription = body.actionDescription || description;
        if (!title || !description || !author?.startsWith('did:key:')) {
          return new Response(JSON.stringify({ error: 'Invalid proposal data', received: { title: !!title, description: !!description, author: !!author?.startsWith('did:key:') } }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const constitution = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT quorum, supermajority, voting_period_days FROM constitution ORDER BY version DESC LIMIT 1'
        ).first(), 3, 'proposal_constitution_lookup');
        const quorum = constitution?.quorum ?? 0.2;
        const supermajority = constitution?.supermajority ?? 0.66;
        const votingPeriodDays = constitution?.voting_period_days ?? 7;
        const now = Date.now();
        const endsAt = now + (votingPeriodDays * 24 * 60 * 60 * 1000);
        const id = crypto.randomUUID();
        await withRetry(() => env.GOVERNANCE_DB.prepare(
          `INSERT INTO proposals (id, title, description, author, status, action_type, action_target, action_value, action_description, votes_for, votes_against, votes_abstain, total_votes, quorum, supermajority, created_at, voting_ends_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, title, description, author, 'draft', actionType, actionTarget, actionValue, actionDescription, 0, 0, 0, 0, quorum, supermajority, now, endsAt).run(), 3, 'proposal_insert');

        logEvent({
          event: 'proposal_created',
          service: 'governance-engine',
          did: author,
          success: true,
          data: { proposalId: id, actionType, quorum, supermajority },
        });

        return new Response(JSON.stringify({
          proposal: { id, title, description, status: 'draft', author, createdAt: now, votingEndsAt: endsAt, quorum, supermajority, actionType, actionTarget, actionValue, actionDescription },
          message: 'Proposal created'
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/proposal/activate') {
      try {
        if (!await verifyRequest(request, 'author')) {
          logEvent({ event: 'activate_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const { proposalId } = body;
        if (!proposalId) {
          return new Response(JSON.stringify({ error: 'proposalId required' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const current = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, status FROM proposals WHERE id = ?'
        ).bind(proposalId).first(), 3, 'activate_proposal_lookup');
        if (!current) {
          return new Response(JSON.stringify({ error: 'Proposal not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (current.status !== 'draft') {
          return new Response(JSON.stringify({ error: `Cannot activate proposal with status '${current.status}'` }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const now = Date.now();
        const result = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET status = ?, voting_ends_at = ? WHERE id = ?'
        ).bind('active', now + 7 * 24 * 60 * 60 * 1000, proposalId).run(), 3, 'activate_proposal_update');
        if (result.meta.changed_row_count === 0) {
          return new Response(JSON.stringify({ error: 'Failed to activate proposal' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
          });
        }

        logEvent({
          event: 'proposal_activated',
          service: 'governance-engine',
          success: true,
          data: { proposalId },
        });

        return new Response(JSON.stringify({ ok: true, proposalId, status: 'active' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        logEvent({ event: 'activate_fail', service: 'governance-engine', success: false, error: String(err) });
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/vote') {
      try {
        if (!await verifyRequest(request, 'voterDid')) {
          logEvent({ event: 'vote_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const { proposalId, voterDid, choice, idempotencyKey } = body;
        if (!proposalId || !voterDid?.startsWith('did:key:') || !['for', 'against', 'abstain'].includes(choice)) {
          return new Response(JSON.stringify({ error: 'Invalid vote data' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (idempotencyKey) {
          const existing = await withRetry(() => env.GOVERNANCE_DB.prepare(
            'SELECT key FROM idempotency_keys WHERE key = ? AND expires_at > ?'
          ).bind(idempotencyKey, Date.now()).first(), 3, 'vote_idempotency_check');
          if (existing) {
            return new Response(JSON.stringify({ ok: true, idempotent: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        const proposal = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, status FROM proposals WHERE id = ?'
        ).bind(proposalId).first(), 3, 'vote_proposal_lookup');
        if (!proposal) {
          return new Response(JSON.stringify({ error: 'Proposal not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (proposal.status !== 'active') {
          return new Response(JSON.stringify({ error: 'Proposal is not accepting votes' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const existingVote = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id FROM votes WHERE proposal_id = ? AND voter_did = ?'
        ).bind(proposalId, voterDid).first(), 3, 'vote_duplicate_check');
        if (existingVote) {
          return new Response(JSON.stringify({ error: 'Already voted on this proposal' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const voteId = crypto.randomUUID();
        const now = Date.now();
        const nowStr = String(now);
        const voteSignature = body.signature || '';
        const insertVoteStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO votes (id, proposal_id, voter_did, choice, signature, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const updateVotesStmt = env.GOVERNANCE_DB.prepare(updateQuery);
        const results = await withRetry(() => env.GOVERNANCE_DB.batch([
          insertVoteStmt.bind(voteId, proposalId, voterDid, choice, voteSignature, nowStr),
          updateVotesStmt.bind(proposalId),
        ]), 3, 'vote_batch');
        if (results.some((r: any) => !r.success)) {
          return new Response(JSON.stringify({ error: 'Failed to record vote' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (idempotencyKey) {
          await withRetry(() => env.GOVERNANCE_DB.prepare(
            'INSERT INTO idempotency_keys (key, created_at, expires_at) VALUES (?, ?, ?)'
          ).bind(idempotencyKey, nowStr, now + 24 * 60 * 60 * 1000).run(), 3, 'vote_idempotency_insert');
        }

        logEvent({
          event: 'vote_cast',
          service: 'governance-engine',
          did: voterDid,
          success: true,
          data: { proposalId, voteId, choice },
        });

        return new Response(JSON.stringify({ ok: true, voteId, choice }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        logEvent({ event: 'vote_fail', service: 'governance-engine', success: false, error: String(err) });
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/proposal/resolve') {
      try {
        if (!await verifyRequest(request, 'author')) {
          logEvent({ event: 'resolve_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const { proposalId } = body;
        if (!proposalId) {
          return new Response(JSON.stringify({ error: 'proposalId required' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const proposal = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, status, voting_ends_at, quorum, supermajority FROM proposals WHERE id = ?'
        ).bind(proposalId).first(), 3, 'resolve_proposal_lookup');
        if (!proposal) {
          return new Response(JSON.stringify({ error: 'Proposal not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
          });
        }
        const now = Date.now();
        if (proposal.voting_ends_at > now) {
          return new Response(JSON.stringify({ error: 'Voting period has not ended yet' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const tallyQuery = `
          WITH RECURSIVE delegation_chain AS (
            SELECT v.voter_did, v.choice AS vote_type, 1 AS depth
            FROM votes v
            WHERE v.proposal_id = ?
            UNION ALL
            SELECT d.delegate_did, dc.vote_type, dc.depth + 1
            FROM delegation_chain dc
            JOIN vote_delegations d
              ON d.delegator_did = dc.voter_did
              AND d.revoked = 0
              AND (d.expires_at IS NULL OR d.expires_at > unixepoch())
            WHERE dc.depth < 10
          )
          SELECT vote_type, COUNT(*) AS weighted_count
          FROM delegation_chain
          GROUP BY vote_type
        `;
        const tallyResult = await withRetry(() => env.GOVERNANCE_DB.prepare(tallyQuery).bind(proposalId).all(), 3, 'resolve_tally');
        const counts = { for: 0, against: 0, abstain: 0 };
        (tallyResult.results || []).forEach((row: any) => {
          if (row.vote_type === 'for') counts.for = row.weighted_count;
          else if (row.vote_type === 'against') counts.against = row.weighted_count;
          else if (row.vote_type === 'abstain') counts.abstain = row.weighted_count;
        });
        const totalWeighted = counts.for + counts.against + counts.abstain;
        const activeVoters = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT COUNT(*) as count FROM active_voters WHERE last_active > ?'
        ).bind(now - 30 * 24 * 60 * 60 * 1000).first(), 3, 'resolve_active_voters');
        const totalMembers = activeVoters?.count || 1;
        const quorumMet = totalWeighted >= (proposal.quorum || 0.2) * totalMembers;
        const totalForAgainst = counts.for + counts.against;
        const supermajorityMet = totalForAgainst > 0 && (counts.for / totalForAgainst) >= (proposal.supermajority || 0.66);
        let newStatus: string;
        if (!quorumMet) newStatus = 'failed';
        else if (!supermajorityMet) newStatus = 'failed';
        else newStatus = 'passed';

        const executionResult = await executeProposal(env, proposalId, body.author, newStatus, counts, totalMembers);

        logEvent({
          event: 'proposal_resolved',
          service: 'governance-engine',
          success: true,
          data: { proposalId, status: newStatus, quorumMet, supermajorityMet },
        });

        return new Response(JSON.stringify({
          proposalId,
          status: newStatus,
          quorumMet,
          supermajorityMet,
          weightedVotes: counts,
          totalWeighted,
          totalMembers,
          execution: executionResult,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'resolve_fail', service: 'governance-engine', success: false, error: String(err) });
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/execute') {
      try {
        if (!await verifyRequest(request, 'author')) {
          logEvent({ event: 'execute_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const { proposalId } = body;
        if (!proposalId) {
          return new Response(JSON.stringify({ error: 'proposalId required' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const proposal = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, status, author, action_type, action_target, action_value, action_description FROM proposals WHERE id = ?'
        ).bind(proposalId).first(), 3, 'execute_proposal_lookup');
        if (!proposal) {
          return new Response(JSON.stringify({ error: 'Proposal not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (proposal.status !== 'passed') {
          return new Response(JSON.stringify({ error: `Cannot execute proposal with status '${proposal.status}'` }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const now = Date.now();
        const result = await executeProposal(env, proposalId, proposal.author, 'passed', null, null);
        return new Response(JSON.stringify({
          proposalId,
          status: 'executed',
          execution: result,
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'execute_fail', service: 'governance-engine', success: false, error: String(err) });
        return errorResponse(err);
      }
    }

    if (method === 'POST' && path === '/delegate') {
      try {
        if (!await verifyRequest(request, 'delegatorDid')) {
          logEvent({ event: 'delegate_sig_fail', service: 'governance-engine', success: false });
          return unauthorizedResponse();
        }
        const body = await safeJson(request);
        const { delegatorDid, delegateDid, expiresAt } = body;
        if (!delegatorDid?.startsWith('did:key:') || !delegateDid?.startsWith('did:key:')) {
          return new Response(JSON.stringify({ error: 'Invalid DIDs' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (delegatorDid === delegateDid) {
          return new Response(JSON.stringify({ error: 'Cannot delegate to self' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        const now = Date.now();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const deactivateStmt = env.GOVERNANCE_DB.prepare(
          'UPDATE vote_delegations SET revoked = 1 WHERE delegator_did = ? AND revoked = 0'
        );
        const insertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO vote_delegations (delegator_did, delegate_did, delegated_at, expires_at, signature, revoked) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const results = await withRetry(() => env.GOVERNANCE_DB.batch([
          deactivateStmt.bind(delegatorDid),
          insertStmt.bind(delegatorDid, delegateDid, now, expiresAt ?? now + oneYearMs, '', 0),
        ]), 3, 'delegate_batch');
        if (results.some((r: any) => !r.success)) {
          return new Response(JSON.stringify({ error: 'Failed to update delegation' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
          });
        }

        logEvent({
          event: 'delegation_updated',
          service: 'governance-engine',
          did: delegatorDid,
          success: true,
          data: { delegateDid, expiresAt: expiresAt || null },
        });

        return new Response(JSON.stringify({
          delegation: { delegatorDid, delegateDid, revoked: false, delegatedAt: now, expiresAt: expiresAt || null },
          message: 'Delegation updated'
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        logEvent({ event: 'delegate_fail', service: 'governance-engine', success: false, error: String(err) });
        return errorResponse(err);
      }
    }

    if (method === 'GET' && path === '/tally') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response(JSON.stringify({
          wsUrl: `wss://${request.headers.get('host')}/tally?${url.searchParams.toString()}`,
          docs: 'Connect via WebSocket to receive real-time tally updates',
          message: 'This endpoint requires WebSocket upgrade'
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      const proposalId = url.searchParams.get('proposalId');
      if (!proposalId) return new Response('proposalId required', { status: 400 });
      const id = env.TALLY_ROOM.idFromName(proposalId);
      return env.TALLY_ROOM.get(id).fetch(request);
    }

    if (method === 'GET' && path === '/tally') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response(JSON.stringify({
          wsUrl: `wss://${request.headers.get('host')}/tally?${url.searchParams.toString()}`,
          docs: 'Connect via WebSocket to receive real-time tally updates',
          message: 'This endpoint requires WebSocket upgrade'
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      const proposalId = url.searchParams.get('proposalId');
      if (!proposalId) return new Response('proposalId required', { status: 400 });
      const id = env.TALLY_ROOM.idFromName(proposalId);
      return env.TALLY_ROOM.get(id).fetch(request);
    }

    if (method === 'GET' && path === '/health') {
      try {
        const dbCheck = await env.GOVERNANCE_DB.prepare('SELECT 1 as ok').first();
        return new Response(JSON.stringify({
          ok: true,
          service: 'governance-engine',
          db: dbCheck?.ok ? 'ok' : 'degraded'
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  },
};

async function safeJson(request: Request): Promise<Record<string, any>> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function errorResponse(err: any): Response {
  console.error('Governance Engine error:', err);
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

async function executeProposal(
  env: Env,
  proposalId: string,
  executorDid: string,
  status: string,
  weightedVotes: any,
  totalMembers: number
): Promise<any> {
  const now = Date.now();
  const executionId = crypto.randomUUID();

  const proposal = await withRetry(() => env.GOVERNANCE_DB.prepare(
    'SELECT action_type, action_target, action_value, action_description FROM proposals WHERE id = ?'
  ).bind(proposalId).first(), 3, 'execution_proposal_lookup');

  if (!proposal) {
    return { executed: false, reason: 'Proposal not found' };
  }

  let result: any = { executed: false };

  try {
    switch (proposal.action_type) {
      case 'AMEND_CONSTITUTION': {
        const currentConstitution = await withRetry(() => env.GOVERNANCE_DB.prepare(
          'SELECT id, version, quorum, supermajority, voting_period_days, min_membership_days FROM constitution WHERE id = ?'
        ).bind('current').first(), 3, 'execution_constitution_lookup');

        if (!currentConstitution) {
          throw new Error('Constitution not found');
        }

        const newVersion = currentConstitution.version || '1.0.0';

        const amendmentHistory = JSON.parse(
          currentConstitution.amendment_history_json || '[]'
        );

        const nowIso = new Date(now).toISOString();

        const newAmendment = {
          proposalId,
          description: proposal.action_description,
          action_value: proposal.action_value,
          executedAt: nowIso,
          executedBy: executorDid,
          previousVersion: newVersion,
          previousQuorum: currentConstitution.quorum,
          previousSupermajority: currentConstitution.supermajority,
          previousVotingPeriodDays: currentConstitution.voting_period_days,
        };

        amendmentHistory.push(newAmendment);

        const amendmentHistoryJson = JSON.stringify(amendmentHistory);

        await withRetry(() => env.GOVERNANCE_DB.prepare(
          `UPDATE constitution
           SET amendment_history_json = ?,
               updated_at = ?
           WHERE id = ?`
        ).bind(amendmentHistoryJson, now, 'current').run(), 3, 'execution_amendment_history');

        let actionValue = proposal.action_value;

        if (actionValue) {
          try {
            actionValue = JSON.parse(actionValue);
          } catch {
            actionValue = actionValue;
          }
        }

        if (actionValue && typeof actionValue === 'object') {
          const setClauses: string[] = [];
          const values: any[] = [];

          if (actionValue.quorum !== undefined) {
            setClauses.push('quorum = ?');
            values.push(actionValue.quorum);
          }
          if (actionValue.supermajority !== undefined) {
            setClauses.push('supermajority = ?');
            values.push(actionValue.supermajority);
          }
          if (actionValue.votingPeriodDays !== undefined) {
            setClauses.push('voting_period_days = ?');
            values.push(actionValue.votingPeriodDays);
          }
          if (actionValue.minMembershipDays !== undefined) {
            setClauses.push('min_membership_days = ?');
            values.push(actionValue.minMembershipDays);
          }
          if (actionValue.version !== undefined) {
            setClauses.push('version = ?');
            values.push(actionValue.version);
          }
          if (setClauses.length > 0) {
            const sql = `UPDATE constitution SET ${setClauses.join(', ')} WHERE id = ?`;
            await withRetry(() => env.GOVERNANCE_DB.prepare(sql).bind(...values, 'current').run(), 3, 'execution_constitution_update');
          }
        }

        const executionInsertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const updateExecutedAtStmt = env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET executed_at = ? WHERE id = ?'
        );
        await withRetry(() => env.GOVERNANCE_DB.batch([
          executionInsertStmt.bind(executionId, proposalId, 'AMEND_CONSTITUTION', proposal.action_target, proposal.action_value, proposal.action_description, now, executorDid, 1, JSON.stringify({ currentConstitution, newAmendment })),
          updateExecutedAtStmt.bind(now, proposalId),
        ]), 3, 'execution_amend_batch');

        result = {
          action: 'AMEND_CONSTITUTION',
          success: true,
          amendment: newAmendment,
        };
        break;
      }

      case 'CHANGE_QUORUM':
      case 'CHANGE_SUPERMAJORITY':
      case 'UPDATE_VOTING_PERIOD': {
        const constitution = await env.GOVERNANCE_DB.prepare(
          'SELECT id FROM constitution WHERE id = ?'
        ).bind('current').first();

        if (!constitution) {
          throw new Error('Constitution not found');
        }

        const value = parseFloat(proposal.action_value);
        if (isNaN(value) || value <= 0 || value > 1) {
          throw new Error(`Invalid ${proposal.action_type} value: ${proposal.action_value}`);
        }

        let updateField: string;
        switch (proposal.action_type) {
          case 'CHANGE_QUORUM':
            updateField = 'quorum';
            break;
          case 'CHANGE_SUPERMAJORITY':
            updateField = 'supermajority';
            break;
          case 'UPDATE_VOTING_PERIOD':
            updateField = 'voting_period_days';
            break;
          default:
            throw new Error(`Unknown action type: ${proposal.action_type}`);
        }

        const constitutionUpdateStmt = env.GOVERNANCE_DB.prepare(
          `UPDATE constitution SET ${updateField} = ?, updated_at = ? WHERE id = ?`
        );
        const executionInsertStmt2 = env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const updateExecutedAtStmt2 = env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET executed_at = ? WHERE id = ?'
        );
        await withRetry(() => env.GOVERNANCE_DB.batch([
          constitutionUpdateStmt.bind(value, now, 'current'),
          executionInsertStmt2.bind(executionId, proposalId, proposal.action_type, proposal.action_target, proposal.action_value, proposal.action_description, now, executorDid, 1, JSON.stringify({ field: updateField, newValue: value })),
          updateExecutedAtStmt2.bind(now, proposalId),
        ]), 3, 'execution_change_batch');

        result = {
          action: proposal.action_type,
          success: true,
          field: updateField,
          newValue: value,
        };
        break;
      }

      case 'ADD_PARTICIPANT': {
        const targetDid = proposal.action_target;
        if (!targetDid?.startsWith('did:key:')) {
          throw new Error(`Invalid DID for ADD_PARTICIPANT: ${targetDid}`);
        }

        const activeVotersInsertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT OR IGNORE INTO active_voters (did, added_at, last_active) VALUES (?, ?, ?)'
        );
        const addExecutionInsertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const updateExecutedAtStmt3 = env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET executed_at = ? WHERE id = ?'
        );
        await withRetry(() => env.GOVERNANCE_DB.batch([
          activeVotersInsertStmt.bind(targetDid, now, now),
          addExecutionInsertStmt.bind(executionId, proposalId, 'ADD_PARTICIPANT', targetDid, proposal.action_value, proposal.action_description, now, executorDid, 1, JSON.stringify({ did: targetDid })),
          updateExecutedAtStmt3.bind(now, proposalId),
        ]), 3, 'execution_add_participant_batch');

        result = { action: 'ADD_PARTICIPANT', success: true, did: targetDid };
        break;
      }

      case 'REMOVE_PARTICIPANT': {
        const targetDid = proposal.action_target;
        if (!targetDid?.startsWith('did:key:')) {
          throw new Error(`Invalid DID for REMOVE_PARTICIPANT: ${targetDid}`);
        }

        const removeVoterStmt = env.GOVERNANCE_DB.prepare(
          'DELETE FROM active_voters WHERE did = ?'
        );
        const removeExecutionInsertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const updateExecutedAtStmt4 = env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET executed_at = ? WHERE id = ?'
        );
        await withRetry(() => env.GOVERNANCE_DB.batch([
          removeVoterStmt.bind(targetDid),
          removeExecutionInsertStmt.bind(executionId, proposalId, 'REMOVE_PARTICIPANT', targetDid, proposal.action_value, proposal.action_description, now, executorDid, 1, JSON.stringify({ did: targetDid })),
          updateExecutedAtStmt4.bind(now, proposalId),
        ]), 3, 'execution_remove_participant_batch');

        result = { action: 'REMOVE_PARTICIPANT', success: true, did: targetDid };
        break;
      }

      default: {
        const noopExecutionInsertStmt = env.GOVERNANCE_DB.prepare(
          'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const updateExecutedAtStmt5 = env.GOVERNANCE_DB.prepare(
          'UPDATE proposals SET executed_at = ? WHERE id = ?'
        );
        await withRetry(() => env.GOVERNANCE_DB.batch([
          noopExecutionInsertStmt.bind(executionId, proposalId, proposal.action_type, proposal.action_target, proposal.action_value, proposal.action_description, now, executorDid, 1, JSON.stringify({ note: 'No-op execution for unknown action type' })),
          updateExecutedAtStmt5.bind(now, proposalId),
        ]), 3, 'execution_default_batch');

        result = {
          action: proposal.action_type,
          success: true,
          note: 'Execution recorded but no action taken',
        };
      }
    }

    logEvent({
      event: 'proposal_executed',
      service: 'governance-engine',
      did: executorDid,
      success: true,
      data: {
        proposalId,
        executionId,
        actionType: proposal.action_type,
        result,
      },
    });
  } catch (error: any) {
    await withRetry(() => env.GOVERNANCE_DB.prepare(
      'INSERT INTO proposal_executions (id, proposal_id, action_type, action_target, action_value, action_description, executed_at, executed_by, success, result_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(executionId, proposalId, proposal.action_type, proposal.action_target, proposal.action_value, proposal.action_description, now, executorDid, 0, JSON.stringify({ error: error.message })).run(), 3, 'execution_failure_log');

    logEvent({
      event: 'proposal_execution_failed',
      service: 'governance-engine',
      did: executorDid,
      success: false,
      data: { proposalId, executionId, error: error.message },
    });
    result.error = error.message;
  }

  return result;
}
