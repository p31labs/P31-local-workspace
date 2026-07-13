import React, { useState, useEffect, useCallback } from 'react';
import { identityStore, getPrivateKey, isValidDID } from '../store/identity';
import { signMessage } from '../lib/crypto';
import {
  fetchProposals,
  fetchConstitution,
  createProposal,
  activateProposal,
  castVote,
  delegateVote,
  fetchTally,
  resolveProposal,
  executeProposal as apiExecuteProposal,
} from '../lib/api/governance';
import { useWebSocketTally } from '../hooks/useWebSocketTally';
import type { Proposal, Constitution } from '../lib/governance/types';

export function GovernanceSurface() {
  const identity = identityStore.get();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [constitution, setConstitution] = useState<Constitution | null>(null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'constitution' | 'new' | 'delegate' | 'vote'>('proposals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spoons, setSpoons] = useState(4);
  const [executing, setExecuting] = useState<string | null>(null);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const { tally: liveTally, isConnected: wsConnected } = useWebSocketTally(activeProposalId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState('AMEND_CONSTITUTION');
  const [actionTarget, setActionTarget] = useState('');
  const [actionValue, setActionValue] = useState('');
  const [actionDesc, setActionDesc] = useState('');

  const [delegateDid, setDelegateDid] = useState('');
  const [delegations, setDelegations] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [proposalsData, constitutionData] = await Promise.all([
        fetchProposals(),
        fetchConstitution(),
      ]);
      setProposals(proposalsData);
      setConstitution(constitutionData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track the first active proposal for real-time WebSocket tally
  useEffect(() => {
    const active = proposals.find(p => p.status === 'active');
    setActiveProposalId(active?.id || null);
  }, [proposals]);

  const handleCreateProposal = useCallback(async () => {
    if (!identity.did || !getPrivateKey()) {
      setError('Please complete the Abdication Ritual first');
      return;
    }

    try {
      const proposal = await createProposal({
        title,
        description,
        author: identity.did,
        actionType,
        actionTarget,
        actionValue,
        actionDescription: actionDesc || `${actionType}: ${actionTarget} → ${actionValue}`,
      });
      setProposals([proposal, ...proposals]);
      setTitle('');
      setDescription('');
      setActiveTab('proposals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
    }
  }, [identity.did, title, description, actionType, actionTarget, actionValue, actionDesc, proposals]);

  const handleResolve = useCallback(async (proposalId: string) => {
    if (!identity.did || !getPrivateKey()) {
      setError('Please complete the Abdication Ritual first');
      return;
    }
    try {
      const result = await resolveProposal(proposalId);
      if (result.status === 'passed' && result.execution) {
        setError(`Proposal passed and executed: ${result.execution.action}`);
      } else if (result.status === 'passed') {
        setError('Proposal passed');
      } else {
        setError(`Proposal ${result.status} — quorum or supermajority not met`);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve proposal');
    }
  }, [identity.did, loadData]);

  const handleExecute = useCallback(async (proposalId: string) => {
    if (!identity.did || !getPrivateKey()) {
      setError('Please complete the Abdication Ritual first');
      return;
    }
    setExecuting(proposalId);
    try {
      const result = await apiExecuteProposal(proposalId);
      setError(`Executed: ${result.execution?.action || result.status}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute proposal');
    } finally {
      setExecuting(null);
    }
  }, [identity.did, loadData]);

  const handleVote = useCallback(async (proposalId: string, choice: 'YES' | 'NO' | 'ABSTAIN') => {
    if (!identity.did || !getPrivateKey()) {
      setError('Please complete the Abdication Ritual first');
      return;
    }

    try {
      await castVote({
        proposalId,
        voterDid: identity.did,
        choice,
        idempotencyKey: `vote-${proposalId}-${identity.did}`,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    }
  }, [identity.did, loadData]);

  const handleDelegate = useCallback(async () => {
    if (!identity.did || !getPrivateKey() || !delegateDid.trim()) return;

    try {
      await delegateVote({
        delegatorDid: identity.did,
        delegateDid,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });
      setDelegations([...delegations, { delegatorDid: identity.did, delegateDid, createdAt: Date.now() }]);
      setDelegateDid('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delegate vote');
    }
  }, [identity.did, delegateDid, delegations]);

  const isLowSpoon = spoons <= 2;
  const isCrisis = spoons === 0;

  if (isCrisis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-4xl mb-4">⚖️</div>
        <p className="text-sm text-white/60 font-light mb-4">Governance is paused. Focus on grounding.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 rounded-xl phos-glass text-white/60 text-xs font-sans"
        >
          Return to Gateway
        </button>
      </div>
    );
  }

  if (isLowSpoon) {
    return (
      <div className="flex flex-col h-full w-full p-4 md:p-6">
        <h1 className="text-2xl font-light tracking-wide text-shimmer">⚖️ Governance</h1>
        <p className="text-xs text-white/40 font-sans mt-1">One action at a time.</p>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-md space-y-3">
            <div className="glass-quiet p-4 rounded-xl text-center">
              <div className="text-xs text-white/40">Active Proposals</div>
              <div className="text-2xl font-light text-white/80">{proposals.filter(p => p.status === 'active').length}</div>
            </div>
            <div className="glass-quiet p-4 rounded-xl text-center">
              <div className="text-xs text-white/40">Your Vote</div>
              <div className="text-sm font-light text-white/60">
                {proposals.some(p => p.status === 'active') ? 'Ready to vote' : 'No active proposals'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('vote')}
            className="w-full max-w-md py-4 rounded-2xl bg-phos-primary/20 border border-phos-primary/30 text-phos-primary text-sm font-sans"
            disabled={!proposals.some(p => p.status === 'active')}
          >
            {proposals.some(p => p.status === 'active') ? 'Cast Your Vote' : 'No Active Proposals'}
          </button>

          <button
            onClick={() => setActiveTab('delegate')}
            className="w-full max-w-md py-3 rounded-2xl phos-glass border border-white/10 text-white/40 text-xs font-sans"
          >
            Delegate Your Vote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-shimmer">Constitutional DAO</h1>
          <p className="text-xs text-white/40 font-mono mt-1">One Person, One Vote — Sovereign Governance</p>
        </div>
        {constitution && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="text-white/40">Quorum</div>
              <div className="text-phos-primary font-mono">{(constitution.votingRules.quorum * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-white/40">Supermajority</div>
              <div className="text-phos-primary font-mono">{(constitution.votingRules.supermajority * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['proposals', 'constitution', 'new', 'delegate'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-sans transition-colors ${
              activeTab === tab
                ? 'phos-glass text-white/80 border border-white/10'
                : 'text-white/70 hover:text-white/90'
            }`}
          >
            {tab === 'proposals' ? 'Proposals' : tab === 'constitution' ? 'Constitution' : tab === 'new' ? 'New Proposal' : 'Delegate'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 glass-wash rounded-xl border border-red-500/30 text-xs text-red-400/80">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-phos-primary/30 border-t-phos-primary rounded-full animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center text-white/70 py-12">
              <p className="text-sm font-light">No proposals yet.</p>
              <p className="text-xs opacity-50 mt-1">Be the first to propose a change.</p>
            </div>
          ) : (
            proposals.map(proposal => {
              const isActive = proposal.status === 'active';
              const isPassed = proposal.status === 'passed';
              const isExecuted = proposal.status === 'executed';
              const progress = proposal.totalVotes / proposal.quorum;

              return (
                <div key={proposal.id} className="p-4 glass-quiet rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans text-white/80">{proposal.title}</span>
                        <span className="text-[10px] font-mono text-white/70">{proposal.status.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-white/40 font-light mt-1 line-clamp-2">{proposal.description}</p>
                      {proposal.action?.type && (
                        <p className="text-[10px] text-phos-primary/60 font-mono mt-1">
                          Action: {proposal.action.type} {proposal.action.target ? `→ ${proposal.action.target}` : ''}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-[10px] text-white/70 font-mono">
                        <span>For: {proposal.votesFor}</span>
                        <span>Against: {proposal.votesAgainst}</span>
                        <span>Abstain: {proposal.votesAbstain}</span>
                        <span>Quorum: {Math.round(progress * 100)}%</span>
                      </div>
                      <div className="w-full h-1 mt-2 rounded-full phos-glass overflow-hidden">
                        <div
                          className="h-full rounded-full bg-phos-primary transition-all duration-300"
                          style={{ width: `${Math.min(100, progress * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 flex-col">
                      {isActive && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleVote(proposal.id, 'YES')}
                            className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'NO')}
                            className="px-2 py-1 rounded text-[10px] font-mono bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            NO
                          </button>
                          <button
                            onClick={() => handleVote(proposal.id, 'ABSTAIN')}
                            className="px-2 py-1 rounded text-[10px] font-mono phos-glass text-white/40 hover:phos-glass"
                          >
                            ABSTAIN
                          </button>
                        </div>
                      )}
                      {isPassed && (
                        <button
                          onClick={() => handleExecute(proposal.id)}
                          disabled={executing === proposal.id}
                          className="px-3 py-1.5 rounded text-[10px] font-mono bg-phos-primary/20 text-phos-primary hover:bg-phos-primary/30 disabled:opacity-50"
                        >
                          {executing === proposal.id ? 'Executing...' : 'Execute'}
                        </button>
                      )}
                      {isExecuted && (
                        <span className="text-[10px] font-mono text-emerald-400/60 text-center">
                          Executed
                          {proposal.executedAt ? `\n${new Date(proposal.executedAt).toLocaleDateString()}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'constitution' && constitution && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-sans text-white/70">The Constitution</h2>
            <div className="space-y-2 text-xs font-mono text-white/40">
              <div className="flex justify-between p-2 glass-quiet rounded">
                <span>Version</span>
                <span className="text-white/60">{constitution.version}</span>
              </div>
              <div className="flex justify-between p-2 glass-quiet rounded">
                <span>Quorum</span>
                <span className="text-white/60">{(constitution.votingRules.quorum * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between p-2 glass-quiet rounded">
                <span>Supermajority</span>
                <span className="text-white/60">{(constitution.votingRules.supermajority * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between p-2 glass-quiet rounded">
                <span>Voting Period</span>
                <span className="text-white/60">{constitution.votingRules.votingPeriodDays} days</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="text-xs font-sans text-white/40 mb-2">Amendment History</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {constitution.amendmentHistory.length === 0 ? (
                  <p className="text-[10px] text-white/70">No amendments yet.</p>
                ) : (
                  constitution.amendmentHistory.map((entry, i) => (
                    <div key={i} className="text-[10px] text-white/70 font-mono flex justify-between">
                      <span>{entry.description}</span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-sans text-white/70">Propose a Change</h2>
            <p className="text-xs text-white/70 font-light">Submit a constitutional amendment. Requires 66% supermajority and 20% quorum.</p>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the rationale for this change..."
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80 h-24 resize-none"
            />

            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/60"
            >
              <option value="AMEND_CONSTITUTION">Amend Constitution</option>
              <option value="CHANGE_QUORUM">Change Quorum</option>
              <option value="CHANGE_SUPERMAJORITY">Change Supermajority</option>
              <option value="ADD_PARTICIPANT">Add Participant</option>
              <option value="REMOVE_PARTICIPANT">Remove Participant</option>
            </select>

            <input
              type="text"
              value={actionTarget}
              onChange={(e) => setActionTarget(e.target.value)}
              placeholder="Target (e.g., quorum)"
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
            />
            <input
              type="text"
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder="New Value"
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
            />

            <button
              onClick={handleCreateProposal}
              disabled={!title || !description || !actionValue}
              className="w-full py-3 rounded-xl phos-glass border border-white/10 text-sm font-sans text-white/80 hover:phos-glass disabled:opacity-40"
            >
              Submit Proposal
            </button>
          </div>
        </div>
      )}

      {activeTab === 'delegate' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-sans text-white/70">Delegate Your Vote</h2>
            <p className="text-xs text-white/70 font-light">Choose someone you trust to vote on your behalf. You can revoke at any time.</p>

            <input
              type="text"
              value={delegateDid}
              onChange={(e) => setDelegateDid(e.target.value)}
              placeholder="Delegate DID"
              className="phos-glass rounded-lg px-4 py-2.5 text-sm outline-none bg-transparent text-white/80"
            />

            <button
              onClick={handleDelegate}
              disabled={!delegateDid.trim()}
              className="w-full py-3 rounded-xl phos-glass border border-white/10 text-sm font-sans text-white/80 hover:phos-glass disabled:opacity-40"
            >
              Delegate Vote
            </button>

            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-sans text-white/40">Your Delegations</h3>
              {delegations.length === 0 ? (
                <p className="text-[10px] text-white/70">No active delegations.</p>
              ) : (
                delegations.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs text-white/40 font-mono">
                    <span>{d.delegatorDid.slice(0, 16)}… → {d.delegateDid.slice(0, 16)}…</span>
                    <button className="min-h-[48px] min-w-[48px] text-red-400/50 hover:text-red-400">Revoke</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
