import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useInstrument } from './lib/useInstrument';
import { deriveOverlay } from './lib/overlay';
import { useProfile } from './lib/useProfile';
import { effectiveTier, resolveSurface, rejectReasonFor } from './lib/surface';
import { floorMotion, PresentationContext, type Presentation } from './lib/usePresentation';
import { EventOverlay } from './components/EventOverlay';
import { Instrument } from './components/Instrument';
import { ProposalDigest } from './components/ProposalDigest';
import { ProposalNode } from './components/ProposalNode';
import { ProposalReviewPanel } from './components/ProposalReviewPanel';
import { TimelineScrubber } from './components/TimelineScrubber';
import { TraceScale } from './components/TraceScale';
import type { LoomEventInput } from '@p31/canon/loom/gate';

const nodeTypes = { proposal: ProposalNode };

// Lazy-load the WebGL closure scene so three.js (and its ~530 kB) is fetched
// only when the user enters the Jitterbug mode — the Canvas mode stays lean.
const JitterbugScene = lazy(() =>
  import('./components/JitterbugScene').then((m) => ({ default: m.JitterbugScene })),
);

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
  const { humanId, profile, overrides, tier, presentation: prefs } = useProfile();
  const overlay = useMemo(() => deriveOverlay(state, idIndex), [state, idIndex]);
  const [focus, setFocus] = useState<string | null>(null);
  const instrument = useInstrument(events, focus);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notYet, setNotYet] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mode, setMode] = useState<'canvas' | 'instrument' | 'jitterbug'>('canvas');
  const [traceView, setTraceView] = useState(false);

  // Reading is writing: opening the instrument or zooming to a zone deposits
  // a `view.read` in the weft, which feeds back into the field.
  useEffect(() => {
    if (mode === 'instrument') instrument.emitRead(humanId);
  }, [mode, focus, instrument.emitRead, humanId]);

  // Progressive disclosure: beginner surfaces the digest; the "show me more"
  // toggle promotes the surface to the full overlay for this session. The
  // log is unchanged — the tier changes what the canvas surfaces.
  const effTier = effectiveTier(tier, showMore);
  const surface = resolveSurface(effTier);
  const { showOverlay, showScrubber } = surface;

  // Presentation axes for the shell. The discrete tiers resolve in useProfile
  // (resolvePresentation); CSS selects on the data-* attributes and JS/canvas/
  // WebGL read them through the presentation context. The OS reduced-motion
  // floor is applied here once, to both the data attribute and the context.
  const density = prefs.density;
  const saturation = prefs.saturation;
  const literalLabels = prefs.literalLabels;
  const osReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = floorMotion(prefs.motion, osReduced);
  const presentation = useMemo<Presentation>(
    () => ({ literalLabels, motion }),
    [literalLabels, motion],
  );

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

  const approve = useCallback(() => {
    if (!proposal) return;
    void postEvent({ writer: 'human', kind: 'approve', proposal: proposal.id }, humanId);
  }, [proposal, humanId]);

  const reject = useCallback(
    (reason: string) => {
      if (!proposal) return;
      void postEvent(
        {
          writer: 'human',
          kind: 'reject',
          proposal: proposal.id,
          reason: rejectReasonFor(effTier, reason),
        },
        humanId,
      );
      setRejectReason('');
      setNotYet(false);
    },
    [proposal, effTier, humanId],
  );

  return (
    <PresentationContext.Provider value={presentation}>
      <div
        className="loom-shell"
      data-tier={effTier}
      data-density={density}
      data-motion={motion}
      data-saturation={saturation}
        data-literal-labels={literalLabels ? '1' : '0'}
      style={overrides}
    >
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
        <button
          className="loom-mode"
          onClick={() => {
            setMode((m) => (m === 'canvas' ? 'instrument' : m === 'instrument' ? 'jitterbug' : 'canvas'));
            setFocus(null);
            setTraceView(false);
          }}
          aria-pressed={mode !== 'canvas'}
        >
          {mode === 'canvas' ? 'Instrument' : mode === 'instrument' ? 'Jitterbug' : 'Canvas'}
        </button>
      </header>

      <main className="loom-canvas">
        {mode === 'instrument' ? (
          traceView && focus ? (
            <TraceScale
              traces={instrument.traces.filter((t) => t.zone === focus)}
              zoneId={focus}
              onBack={() => setTraceView(false)}
            />
          ) : (
            <Instrument
              scene={instrument.scene}
              reading={instrument.reading}
              onFocus={setFocus}
              onTrace={() => setTraceView(true)}
            />
          )
        ) : mode === 'jitterbug' ? (
          <Suspense fallback={<div className="loom-loading">opening the jitterbug…</div>}>
            <JitterbugScene />
          </Suspense>
        ) : (
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
        )}
      </main>

      <aside className="loom-panel">
        {proposal ? (
          <ProposalReviewPanel
            proposal={proposal}
            tier={effTier}
            reason={rejectReason}
            notYet={notYet}
            onApprove={approve}
            onReject={reject}
            onReasonChange={setRejectReason}
            onToggleNotYet={() => setNotYet(true)}
            onBack={() => setSelectedProposal(null)}
          />
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
    </PresentationContext.Provider>
  );
}
