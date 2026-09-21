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
import { useTheme } from './lib/useTheme';
import { effectiveTier, resolveSurface, rejectReasonFor } from './lib/surface';
import { floorMotion, PresentationContext, type Presentation } from './lib/usePresentation';
import { useProgression } from './lib/useProgression';
import { AgentCursor } from './components/AgentCursor';
import { BuilderChapter } from './components/BuilderChapter';
import { ChildChapter } from './components/ChildChapter';
import { CreativeChapter } from './components/CreativeChapter';
import { WorkshopChapter } from './components/WorkshopChapter';
import { CompanionView } from './components/CompanionView';
import { DocsView } from './components/DocsView';
import { EventOverlay } from './components/EventOverlay';
import { Instrument } from './components/Instrument';
import { Launchpad } from './components/Launchpad';
import { ProposalDigest } from './components/ProposalDigest';
import { ProposalNode } from './components/ProposalNode';
import { LoomNode } from './components/LoomNode';
import { ProposalReviewPanel } from './components/ProposalReviewPanel';
import { TimelineScrubber } from './components/TimelineScrubber';
import { TraceScale } from './components/TraceScale';
import type { LoomEventInput } from '@p31/canon/loom/gate';

const nodeTypes = { proposal: ProposalNode, loom: LoomNode };

// Lazy-load the WebGL closure scene so three.js (and its ~530 kB) is fetched
// only when the user enters the Jitterbug mode — the Canvas mode stays lean.
const JitterbugScene = lazy(() =>
  import('./components/JitterbugScene').then((m) => ({ default: m.JitterbugScene })),
);

/** Decide the scope of a human event from the canvas: a focus on a `color-*`
 *  node is the child's private idea (personal); every other human action
 *  (the orb, an approval, a rejection, a saved read) is family co-presence
 *  (shared). Agent events are always shared. */
function scopeFor(input: LoomEventInput): 'personal' | 'shared' {
  if (input.writer === 'agent') return 'shared';
  if (input.kind === 'focus' && typeof input.node === 'string' && input.node.startsWith('color-')) {
    return 'personal';
  }
  return 'shared';
}

function commitThrough(humanId: string | null) {
  return (event: LoomEventInput) => {
    const scope = scopeFor(event);
    // A personal scope is only valid with an identity. An anonymous session
    // (no humanId yet) falls back to shared — a scope nobody can enforce is a
    // leak, and the gate rejects it.
    const effective = scope === 'personal' && humanId ? 'personal' : 'shared';
    return void postEvent(event, event.writer === 'human' ? humanId : null, effective);
  };
}
async function postEvent(
  input: LoomEventInput,
  humanId: string | null,
  scope: 'personal' | 'shared' = 'shared',
): Promise<void> {
  try {
    const body =
      humanId && scope === 'personal'
        ? { input: { ...input, scope, humanId } }
        : { input: { ...input, scope } };
    await fetch('/api/loom/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // middleware absent (production build) — no-op
  }
}

/** A coarse, gentle age string — the ADHD time-blindness affordance. */
function timeAgo(ts: string, now: number): string {
  const mins = Math.floor((now - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `~${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `~${hrs}h ago`;
  return `~${Math.floor(hrs / 24)}d ago`;
}

export default function App() {
  const { nodes: baseNodes, edges: baseEdges, counts } = useMemo(() => buildGraph(), []);
  const idIndex = useMemo(() => buildIdIndex(), []);
  const positions = useMemo(() => new Map(baseNodes.map((n) => [n.id, n.position])), [baseNodes]);

  const { events, state, seq, scrub, follow } = useLoomState();
  const chapter = useProgression(events);
  const { humanId, profile, overrides, tier, presentation: prefs } = useProfile();
  const { theme, current, cycleTheme } = useTheme();
  const overlay = useMemo(() => deriveOverlay(state, idIndex), [state, idIndex]);
  const [focus, setFocus] = useState<string | null>(null);
  const instrument = useInstrument(events, focus);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notYet, setNotYet] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mode, setMode] = useState<'launchpad' | 'canvas' | 'instrument' | 'jitterbug' | 'creative' | 'workshop' | 'companion' | 'docs'>(() => {
    if (typeof location === 'undefined') return 'launchpad';
    const m = new URLSearchParams(location.search).get('mode');
    return m === 'canvas' || m === 'instrument' || m === 'jitterbug' || m === 'creative' || m === 'workshop' || m === 'companion' || m === 'docs' ? m : 'launchpad';
  });
  const [traceView, setTraceView] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [started, setStarted] = useState(false);
  // The chapter journey is gated behind the Launchpad: a child who entered via
  // Start sees the chapters; a direct /?mode=canvas visitor (instrument) never
  // gets switched into a chapter view by a stray focus event.
  const isLevel1 =
    mode === 'launchpad' ||
    mode === 'creative' ||
    mode === 'workshop' ||
    mode === 'companion' ||
    mode === 'docs' ||
    (started && mode === 'canvas' && chapter <= 3);

  // Chapter progression: after the child has "made something happen" (tapped
  // the field orb — a focus on `orb`), Lumi proposes after a beat — that's
  // the bridge to the builder view. Triggering off the orb tap, not a bare
  // chapter check, keeps the orb beat (Make something happen) from racing the
  // propose. Only in the Launchpad journey (started); a direct canvas visitor
  // isn't a child.
  useEffect(() => {
    if (!started || chapter !== 1) return;
    const madeItHappen = events.some(
      (e) => e.writer === 'human' && e.kind === 'focus' && e.node === 'orb',
    );
    if (!madeItHappen) return;
    const t = setTimeout(() => {
      void postEvent(
        {
          writer: 'agent',
          kind: 'propose',
          id: `lumi-idea-${Date.now()}`,
          node: 'lumi',
          body: { change: 'add a warm color to the field' },
          author: 'lumi',
        },
        null,
      );
    }, 3500);
    return () => clearTimeout(t);
  }, [started, chapter, events]);

  // Reading is writing: opening the instrument or zooming to a zone deposits
  // a `view.read` in the weft, which feeds back into the field.
  useEffect(() => {
    if (mode === 'instrument') instrument.emitRead(humanId);
  }, [mode, focus, instrument.emitRead, humanId]);

  // Attention-as-light: the field's reading is the light. Entropy raises the
  // intensity; the most-severed zone shifts the hue (cyan 195 → red 255). The
  // shadow stays fixed — a moving light disorients. Re-reads as the field cools.
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.loom-shell');
    if (!shell) return;
    const zones = instrument.reading.zones;
    const maxHazard = zones.length > 0 ? Math.max(...zones.map((z) => z.hazard)) : 0;
    const entropy = instrument.reading.complexity.entropy;
    shell.style.setProperty('--loom-light-intensity', (0.3 + entropy * 0.5).toFixed(3));
    shell.style.setProperty('--loom-light-hue', String(Math.round(195 + maxHazard * 60)));
  }, [instrument.reading]);

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

  // The agent cursor's screen position: the agent's current node (flow
  // coordinates) mapped through the ReactFlow viewport (pan + zoom).
  const cursorPos = useMemo(() => {
    if (!state.agentCursor) return null;
    // agentCursor is a bare node name; resolve it to the namespaced id the
    // graph positions are keyed by (token:--p31-accent vs --p31-accent).
    const namespaced = idIndex.get(state.agentCursor) ?? state.agentCursor;
    const p = positions.get(namespaced);
    if (!p) return null;
    return { x: p.x * viewport.zoom + viewport.x, y: p.y * viewport.zoom + viewport.y };
  }, [state.agentCursor, idIndex, positions, viewport]);

  // "Continue where you left off" — the most recent named save within a day,
  // surfaced as a working-memory affordance (external structure for ADHD).
  // `now` bumps once a minute so the "~N ago" estimate stays live, not frozen.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const recentSave = useMemo(() => {
    const saves = state.saves;
    if (saves.length === 0) return null;
    const last = saves[saves.length - 1];
    if (last.to === seq) return null; // already at (or past) the saved point
    if (now - new Date(last.ts).getTime() > 24 * 3600 * 1000) return null;
    return last;
  }, [state.saves, seq, now]);

  const saveView = useCallback(() => {
    void postEvent(
      { writer: 'human', kind: 'view.save', label: focus ?? 'field', from: 0, to: seq },
      humanId,
    );
  }, [focus, seq, humanId]);

  const nodes: Node[] = useMemo(() => {
    const trail = new Set(overlay.pathIds);
    const base = baseNodes.map((n) => ({
      id: n.id,
      position: n.position,
      type: 'loom',
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
        data-theme={theme}
        data-loom-level={isLevel1 ? '1' : '2'}
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
        {recentSave && (
          <button
            className="loom-continue"
            onClick={() => scrub(recentSave.to)}
            title={`Saved "${recentSave.label}" — jump back to it`}
            data-agent-kind="action"
            data-agent-action="view.continue"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            ↩ Continue: {recentSave.label} ({timeAgo(recentSave.ts, now)})
          </button>
        )}
        <span className="loom-gate">human + agent, one log</span>
        {events.length > 0 && (
          <button
            className="loom-save"
            onClick={saveView}
            title="Name and keep this view"
            data-agent-kind="action"
            data-agent-action="view.save"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Save
          </button>
        )}
        <button
          className="loom-theme"
          onClick={cycleTheme}
          title="Change the look"
          data-agent-kind="action"
          data-agent-action="theme.cycle"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          {current.emoji} {current.label}
        </button>
        <button
          className="loom-mode"
          onClick={() => {
            setMode((m) => (m === 'canvas' ? 'instrument' : m === 'instrument' ? 'jitterbug' : 'canvas'));
            setFocus(null);
            setTraceView(false);
          }}
          aria-pressed={mode !== 'canvas'}
          data-agent-kind="action"
          data-agent-action="mode.toggle"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          {mode === 'canvas' ? 'Instrument' : mode === 'instrument' ? 'Jitterbug' : 'Canvas'}
        </button>
      </header>

      <main className="loom-canvas">
        {mode === 'launchpad' ? (
          <Launchpad
            onStart={() => { setStarted(true); setMode('canvas'); }}
            onCompanion={() => setMode('companion')}
          />
        ) : mode === 'instrument' ? (
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
        ) : mode === 'companion' ? (
          <CompanionView
            events={events}
            onExit={() => setMode('launchpad')}
            commit={commitThrough(humanId)}
          />
        ) : mode === 'docs' ? (
          <DocsView />
        ) : mode === 'workshop' ? (
          <WorkshopChapter
            events={events}
            onProgress={() => setMode('instrument')}
            commit={commitThrough(humanId)}
          />
        ) : mode === 'creative' ? (
          <CreativeChapter
            events={events}
            onProgress={() => setMode('workshop')}
            commit={commitThrough(humanId)}
          />
        ) : mode === 'canvas' ? (
          // BuilderChapter holds through chapter 3 (a decision exists) so the
          // celebration and hand-off can land before Chapter 4 (the child's
          // own idea) unlocks.
          started && (chapter === 2 || chapter === 3) ? (
            <BuilderChapter
              events={events}
              onProgress={() => setMode('creative')}
              onApprove={(proposalId) =>
                void postEvent(
                  { writer: 'human', kind: 'approve', proposal: proposalId },
                  humanId,
                )
              }
              onReject={(proposalId, reason) =>
                void postEvent(
                  { writer: 'human', kind: 'reject', proposal: proposalId, reason },
                  humanId,
                )
              }
            />
          ) : started && chapter <= 1 ? (
            <ChildChapter
              events={events}
              onProgress={() => setMode('instrument')}
              onFocus={(node) =>
                void postEvent({ writer: 'human', kind: 'focus', node }, humanId)
              }
            />
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onMove={(_, vp) => setViewport(vp)}
                fitView
                fitViewOptions={{ duration: 0 }}
                nodeClickDistance={16}
                minZoom={0.03}
                maxZoom={4}
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={40} size={1} />
                <MiniMap pannable zoomable />
                <Controls />
              </ReactFlow>
              <AgentCursor position={cursorPos} label={state.agentCursor ?? undefined} />
            </>
          )
        ) : null}
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
          <button
            className="loom-more"
            onClick={() => setShowMore((v) => !v)}
            data-agent-kind="action"
            data-agent-action="surface.show_more"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
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
