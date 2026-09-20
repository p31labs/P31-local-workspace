import { useEffect, useState, type ReactElement } from 'react';
import { P31_TOKEN_NAMES } from '@p31/canon/tokens';

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
}

/**
 * ?mode=docs — the docs surface. A hidden, fourth-audience mode (no switcher
 * entry; chrome hidden via the same isLevel1 path the instrument uses).
 *
 * Two panes, both reading the LIVE contract rather than a copy:
 *   - Tokens: the P31TokenName union, each rendered with a swatch painted
 *     `var(--p31-*)`. A token added to the canon appears here with no doc
 *     edit — the surface cannot drift.
 *   - Actions: the AAF manifest, each entry with schema/danger/confirm and
 *     the `surfaced: agent-side` annotation rendered as such.
 *
 * The log step-through is a follow-up; it teaches the fold, which is a
 * different job from showing the contract.
 */
export function DocsView({ manifestUrl = '/.well-known/agent-manifest.json' }: Props) {
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