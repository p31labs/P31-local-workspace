import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import { buildGraph, buildIdIndex } from './graph';
import { useLoomState } from './lib/useLoomState';
import { deriveOverlay } from './lib/overlay';
import { useProfile } from './lib/useProfile';
import { EventOverlay } from './components/EventOverlay';
import { ProposalDigest } from './components/ProposalDigest';
import { ProposalNode } from './components/ProposalNode';
import { TimelineScrubber } from './components/TimelineScrubber';
import type { LoomEventInput } from '@p31/canon/loom/gate';

const nodeTypes = { proposal: ProposalNode };

/** The canvas writes ONLY through /api/loom/event -> commit(). */
async function postEvent(input: LoomEventInput, humanId: string | null): Promise<void> {
  try {
    const body = humanId ? { input: { ...input, humanId } } : { input };
    await fetch('/api/loom/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // middleware absent (production build) — no-op
  }
}

export default function App() {
  const { nodes: baseNodes, edges: baseEdges, counts } = useMemo(() => buildGraph(), []);
  const idIndex = useMemo(() => buildIdIndex(), []);
  const positions = useMemo(() => new Map(baseNodes.map((n) => [n.id, n.position])), [baseNodes]);

  const { events, state, seq, scrub, follow } = useLoomState();
  const { humanId, profile, overrides, tier } = useProfile();
  const overlay = useMemo(() => deriveOverlay(state, idIndex), [state, idIndex]);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notYet, setNotYet] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Progressive disclosure: beginner surfaces the digest; the "show me more"
  // toggle promotes the surface to the full overlay for this session. The
  // log is unchanged — the tier changes what the canvas surfaces.
  const effectiveTier = showMore ? 'advanced' : tier;
  const showOverlay = effectiveTier !== 'beginner';
  const showScrubber = effectiveTier === 'advanced';

  const nodes: Node[] = useMemo(() => {
    const trail = new Set(overlay.pathIds);
    const base = baseNodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: n.data,
      className: [
        'loom-node',
        `loom-node--${n.data.kind}`,
        n.id === overlay.focusedId ? 'loom-node--focused' : '',
        n.id === overlay.cursorId ? 'loom-node--cursor' : '',
        trail.has(n.id) ? 'loom-node--trail' : '',
      ]
        .filter(Boolean)
        .join(' '),
    }));

    const ghosts = overlay.ghosts.map((g) => {
      const target = g.nodeId ? positions.get(g.nodeId) : undefined;
      const pos = target ? { x: target.x + 64, y: target.y + 28 } : { x: 0, y: 0 };
      const survival = Math.max(0, Math.min(1, g.overallSurvival));
      const tone = survival > 0.8 ? 'loom-survival--ok' : survival > 0.5 ? 'loom-survival--warn' : 'loom-survival--drift';
      return {
        id: `ghost:${g.id}`,
        position: pos,
        type: 'proposal',
        data: {
          label: `✳ ${g.id} · ${g.status}${g.nodeId ? '' : ' · unresolved'}`,
          survival: g.overallSurvival,
          tone,
        },
        className: `loom-node loom-node--proposal loom-node--proposal--${g.status}`,
      };
    });
    return [...base, ...ghosts];
  }, [baseNodes, positions, overlay]);

  const edges: Edge[] = useMemo(
    () => baseEdges.map((e) => ({ ...e, className: 'loom-edge' })),
    [baseEdges],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const id = String(node.id);
    if (id.startsWith('ghost:')) {
      setNotYet(false);
      setRejectReason('');
      setSelectedProposal(id.slice('ghost:'.length));
      return;
    }
    setSelectedProposal(null);
    setNotYet(false);
    setRejectReason('');
    const bare = (node.data as { bare?: string }).bare;
    if (bare) void postEvent({ writer: 'human', kind: 'focus', node: bare }, humanId);
  }, [humanId]);

  const selectProposal = useCallback((id: string) => {
    setNotYet(false);
    setRejectReason('');
    setSelectedProposal(id);
  }, []);

  const proposal = selectedProposal ? state.proposals.get(selectedProposal) : null;

  return (
    <div className="loom-shell" data-tier={effectiveTier} style={overrides}>
      <header className="loom-bar">
        <strong>The Loom</strong>
        <span className="loom-counts">
          {counts.tokens} tokens · {counts.cssClasses} classes · {counts.components} component · {counts.themes} themes
        </span>
        {profile?.displayName && (
          <span className="loom-human" title={profile.pronouns ?? undefined}>
            {profile.displayName}
            {profile.pronouns ? ` (${profile.pronouns})` : ''}
          </span>
        )}
        {state.agentCursor && (
          <span className="loom-agent">
            agent @ {state.agentCursor} · attention {overlay.attention.toFixed(2)}
          </span>
        )}
        <span className="loom-gate">human + agent, one log</span>
      </header>

      <main className="loom-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.03}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={40} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </main>

      <aside className="loom-panel">
        {proposal ? (
          <div>
            <div className="loom-kind loom-kind--component">proposal</div>
            <h2>{proposal.id}</h2>
            <p className="loom-hint">
              node: {proposal.node} · status: {proposal.status} · rev {proposal.revision}
            </p>
            <p className="loom-summary">
              An agent proposed a change to <code>{proposal.node}</code>
              {proposal.author !== 'unknown' ? ` · authored by ${proposal.author}` : ''}.
              Nothing in the canon changes until you approve.
            </p>
            <div className="loom-actions">
              <button
                className="loom-btn loom-btn--ok"
                onClick={() => void postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id }, humanId)}
              >
                {effectiveTier === 'beginner' ? 'Looks good' : 'Approve'}
              </button>
              {effectiveTier === 'beginner' && !notYet ? (
                <button className="loom-btn loom-btn--no" onClick={() => setNotYet(true)}>
                  Not yet
                </button>
              ) : (
                <div className="loom-reject">
                  <input
                    className="loom-reason"
                    placeholder="reason (optional)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <button
                    className="loom-btn loom-btn--no"
                    onClick={() => {
                      void postEvent(
                        {
                          writer: 'human',
                          kind: 'reject',
                          proposal: proposal.id,
                          reason: rejectReason.trim() || (effectiveTier === 'beginner' ? 'deferred by human' : 'rejected by human'),
                        },
                        humanId,
                      );
                      setRejectReason('');
                      setNotYet(false);
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
            {effectiveTier === 'advanced' && (
              <pre className="loom-json">{JSON.stringify(proposal.body, null, 2)}</pre>
            )}
          </div>
        ) : showOverlay ? (
          <EventOverlay events={events} seq={seq} onFollow={follow} onSelect={scrub} />
        ) : (
          <ProposalDigest state={state} onSelect={selectProposal} />
        )}
        {tier === 'beginner' && !proposal && (
          <button className="loom-more" onClick={() => setShowMore((v) => !v)}>
            {showMore ? 'show me less' : 'show me more'}
          </button>
        )}
      </aside>

      {showScrubber && (
        <footer className="loom-scrub">
          <TimelineScrubber logLength={events.length} currentSeq={seq} onSeqChange={scrub} />
        </footer>
      )}
    </div>
  );
}
