// L4.3 — A2UI v0.9 React renderer. Consumes the message produced by
// toA2UI() and renders it declaratively, honoring the P31 spoon-aware
// extension (crisisMode / spoons) per DESIGN.md. A2UI clients ignore the
// `extensions.p31` namespace, so non-P31 renderers still work.
import React from 'react';
import type { A2UIMessage, A2UIComponent } from './a2ui';

function resolveChildren(
  children: A2UIComponent['children'],
  map: Map<string, A2UIComponent>,
): A2UIComponent[] {
  if (!children) return [];
  if (Array.isArray(children)) {
    return children.map((id) => map.get(id)).filter(Boolean) as A2UIComponent[];
  }
  // Template form { componentId, path } needs the data model; render the
  // template component as a single placeholder node.
  const tpl = map.get(children.componentId);
  return tpl ? [tpl] : [];
}

function renderComponent(
  comp: A2UIComponent,
  map: Map<string, A2UIComponent>,
  key: string,
): React.ReactNode {
  const childNodes = resolveChildren(comp.children, map).map((c, i) =>
    renderComponent(c, map, `${key}-${i}`),
  );
  const label = comp.accessibility?.label;
  const aria = label ? { 'aria-label': label } : {};

  switch (comp.component) {
    case 'Column':
      return (
        <div key={key} {...aria} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {childNodes}
        </div>
      );
    case 'Row':
      return (
        <div key={key} {...aria} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {childNodes}
        </div>
      );
    case 'Card':
      return (
        <section key={key} {...aria} className="a2ui-card" style={{ border: '1px solid #22d3ee', borderRadius: 12, padding: 12 }}>
          {label && <h3>{label}</h3>}
          {childNodes}
        </section>
      );
    case 'List':
      return (
        <ul key={key} {...aria}>
          {childNodes}
        </ul>
      );
    case 'Text':
      return (
        <p key={key} {...aria}>
          {label ?? ''}
        </p>
      );
    case 'Button':
      return (
        <button key={key} {...aria} type="button">
          {label ?? 'Action'}
        </button>
      );
    case 'Divider':
      return <hr key={key} {...aria} />;
    default:
      return (
        <div key={key} {...aria}>
          {label}
          {childNodes}
        </div>
      );
  }
}

export function A2UIRenderer({ message }: { message: A2UIMessage }) {
  const p31 = message.extensions?.p31;
  const crisis = p31?.crisisMode;
  const map = new Map<string, A2UIComponent>(
    (message.updateComponents?.components ?? []).map((c) => [c.id, c]),
  );
  const root = map.get('root');
  if (!root) return <div className="a2ui-empty">No root surface</div>;
  return (
    <div
      className={crisis ? 'a2ui-surface a2ui-crisis' : 'a2ui-surface'}
      data-spoons={p31?.spoons !== undefined ? String(p31.spoons) : undefined}
    >
      {renderComponent(root, map, 'root')}
    </div>
  );
}

export default A2UIRenderer;
