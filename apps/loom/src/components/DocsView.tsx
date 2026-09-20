import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { P31_TOKEN_NAMES } from '@p31/canon/tokens';
import { initialState, reduce } from '@p31/canon/loom/events';
import type { LoomEvent } from '@p31/canon/loom/events';

interface ManifestEntry {
  name: string;
  kind: string;
  danger: string;
  confirm: string;
  schema: Record<string, unknown>;
  description?: string;
  surfaced?: string;
}

interface Props {
  /** Overridable for tests. */
  manifestUrl?: string;
  /** The demo seed the log pane steps through. Overridable for tests. */
  seedUrl?: string;
}

/**
 * ?mode=docs — the docs surface. A hidden, fourth-audience mode (no switcher
 * entry; chrome hidden via the same isLevel1 path the instrument uses).
 *
 * Three panes, all reading the LIVE contract rather than a copy:
 *   - Tokens: the P31TokenName union, each rendered with a swatch painted
 *     `var(--p31-*)`. A token added to the canon appears here with no doc
 *     edit — the surface cannot drift.
 *   - Actions: the AAF manifest, each entry with schema/danger/confirm and
 *     the `surfaced: agent-side` annotation rendered as such.
 *   - Log: events.seed.json stepped through, one event at a time, showing the
 *     folded state at each step — the clearest explanation of "every visible
 *     state is a pure fold of the log": the sentence, executed.
 */
export function DocsView({ manifestUrl = '/.well-known/agent-manifest.json', seedUrl = '/events.seed.json' }: Props) {
  const tokens = [...P31_TOKEN_NAMES].sort();

  return (
    <main className="docs-view" data-agent-kind="region" data-agent-action="docs.view">
      <header className="docs-header">
        <h1 className="docs-title">The Loom — live contract</h1>
        <p className="docs-lede">
          These panes read the running app, not a copy. If a token is added to
          the canon or an action to the manifest, it appears here on the next
          load. That is the point.
        </p>
      </header>

      <section className="docs-pane" aria-labelledby="docs-tokens">
        <h2 id="docs-tokens" className="docs-pane-title">
          Tokens ({tokens.length})
        </h2>
        <p className="docs-pane-note">
          The <code>P31TokenName</code> union from <code>@p31/canon/tokens</code>.
          Swatches are painted with <code>var(--p31-*)</code>.
        </p>
        <ul className="docs-tokens">
          {tokens.map((name) => (
            <li key={name} className="docs-token">
              <span className="docs-token-swatch" style={{ background: `var(${name})` }} aria-hidden="true" />
              <code className="docs-token-name">{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="docs-pane" aria-labelledby="docs-actions">
        <h2 id="docs-actions" className="docs-pane-title">Actions</h2>
        <ActionsPane url={manifestUrl} />
      </section>

      <section className="docs-pane" aria-labelledby="docs-log">
        <h2 id="docs-log" className="docs-pane-title">Log</h2>
        <p className="docs-pane-note">
          The demo seed (<code>{seedUrl}</code>) stepped through. Every visible
          state is a pure fold of these events — watch the fold land.
        </p>
        <LogPane url={seedUrl} />
      </section>
    </main>
  );
}

function ActionsPane({ url }: { url: string }): ReactElement {
  const [entries, setEntries] = useState<ManifestEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((json: { actions?: ManifestEntry[] }) => {
        if (alive) setEntries(json.actions ?? []);
      })
      .catch((e: unknown) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [url]);

  if (error) return <p className="docs-pane-note">Could not load the manifest: {error}</p>;
  if (!entries) return <p className="docs-pane-note">Loading…</p>;

  const dom = entries.filter((e) => e.surfaced !== 'agent-side');
  const agent = entries.filter((e) => e.surfaced === 'agent-side');

  return (
    <>
      <p className="docs-pane-note">
        From <code>{url}</code>. {dom.length} DOM actions, {agent.length} agent-side verbs.
      </p>
      <ul className="docs-actions">
        {entries.map((a) => (
          <li key={a.name} className={`docs-action docs-action--${a.danger}`}>
            <code className="docs-action-name">{a.name}</code>
            <span className="docs-action-meta">
              {a.danger} · {a.confirm}
              {a.surfaced === 'agent-side' && ' · agent-side'}
            </span>
            {a.description && <p className="docs-action-desc">{a.description}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

function LogPane({ url }: { url: string }): ReactElement {
  const [events, setEvents] = useState<LoomEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((es: LoomEvent[]) => {
        if (alive) setEvents(es);
      })
      .catch((e: unknown) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, [url]);

  const stateAt = useMemo(() => {
    if (!events) return null;
    let s = initialState();
    for (let i = 0; i < Math.min(at, events.length); i++) s = reduce(s, events[i]);
    return s;
  }, [events, at]);

  if (error) return <p className="docs-pane-note">Could not load the seed: {error}</p>;
  if (!events) return <p className="docs-pane-note">Loading…</p>;
  if (events.length === 0) return <p className="docs-pane-note">The seed is empty.</p>;

  const current = events[at];
  const state = stateAt;

  return (
    <div className="docs-log">
      <div className="docs-log-controls">
        <button
          type="button"
          className="docs-log-btn"
          onClick={() => setAt((v) => Math.max(0, v - 1))}
          disabled={at === 0}
        >
          ←
        </button>
        <span className="docs-log-pos">
          #{current.seq} {current.writer} · {current.kind}
        </span>
        <button
          type="button"
          className="docs-log-btn"
          onClick={() => setAt((v) => Math.min(events.length - 1, v + 1))}
          disabled={at === events.length - 1}
        >
          →
        </button>
      </div>
      <div className="docs-log-state">
        <p className="docs-log-line">
          focused: <code>{state?.focused ?? '—'}</code>
        </p>
        <p className="docs-log-line">
          agent cursor: <code>{state?.agentCursor ?? '—'}</code>
        </p>
        <p className="docs-log-line">
          attention: <code>{state?.agentAttention.toFixed(2)}</code>
        </p>
        <p className="docs-log-line">
          proposals: <code>{state?.proposals.size ?? 0}</code>
        </p>
        <p className="docs-log-line">
          agent path: <code>{state?.agentPath.join(' → ') || '—'}</code>
        </p>
      </div>
    </div>
  );
}