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
import { EventOverlay } from './components/EventOverlay';
import { ProposalNode } from './components/ProposalNode';
import { TimelineScrubber } from './components/TimelineScrubber';
import type { LoomEventInput } from '@p31/canon/loom/gate';

const nodeTypes = { proposal: ProposalNode };

/** The canvas writes ONLY through /api/loom/event -> commit(). */
async function postEvent(input: LoomEventInput): Promise<void> {
  try {
    await fetch('/api/loom/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
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
  const overlay = useMemo(() => deriveOverlay(state, idIndex), [state, idIndex]);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
      setSelectedProposal(id.slice('ghost:'.length));
      return;
    }
    setSelectedProposal(null);
    const bare = (node.data as { bare?: string }).bare;
    if (bare) void postEvent({ writer: 'human', kind: 'focus', node: bare });
  }, []);

  const proposal = selectedProposal ? state.proposals.get(selectedProposal) : null;

  return (
    <div className="loom-shell">
      <header className="loom-bar">
        <strong>The Loom</strong>
        <span className="loom-counts">
          {counts.tokens} tokens · {counts.cssClasses} classes · {counts.components} component · {counts.themes} themes
        </span>
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
            <div className="loom-actions">
              <button
                className="loom-btn loom-btn--ok"
                onClick={() => void postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id })}
              >
                Approve
              </button>
            </div>
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
                  void postEvent({
                    writer: 'human',
                    kind: 'reject',
                    proposal: proposal.id,
                    reason: rejectReason.trim() || 'rejected by human',
                  });
                  setRejectReason('');
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <EventOverlay events={events} seq={seq} onFollow={follow} onSelect={scrub} />
        )}
      </aside>

      <footer className="loom-scrub">
        <TimelineScrubber logLength={events.length} currentSeq={seq} onSeqChange={scrub} />
      </footer>
    </div>
  );
}
