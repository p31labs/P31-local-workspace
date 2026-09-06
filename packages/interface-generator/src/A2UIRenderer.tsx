// L4.4 — A2UI v1.0 React renderer. Supports actionId/onAction for interactive
// components, spoon-aware crisis mode, and P31 extensions. Backward-compatible
// with v0.9 messages (defaults version to v0.9).
import React from 'react';
import type { A2UIMessage, A2UIComponent } from './a2ui';
import { ICON_CATALOG, type IconMetadata } from './icons';

export interface A2UIRendererProps {
  message: A2UIMessage;
  onAction?: (actionId: string, componentId: string, props?: Record<string, any>) => void;
}

export type ActionEvent = {
  actionId: string;
  componentId: string;
  props?: Record<string, any>;
  timestamp: number;
};

const SIZE_MAP: Record<string, number> = { sm: 24, md: 40, lg: 64 };

function resolveChildren(
  children: A2UIComponent['children'],
  map: Map<string, A2UIComponent>,
): A2UIComponent[] {
  if (!children) return [];
  if (Array.isArray(children)) {
    return children.map((id) => map.get(id)).filter(Boolean) as A2UIComponent[];
  }
  const tpl = map.get(children.componentId);
  return tpl ? [tpl] : [];
}

function renderIcon(props: Record<string, unknown> | undefined, aria: Record<string, string>): React.ReactNode {
  if (!props) return <div style={{ color: 'var(--p31-text-tertiary)', fontFamily: 'var(--p31-font-mono)', fontSize: 11 }}>missing icon props</div>;
  const name = props.name as string | undefined;
  const meta: IconMetadata | undefined = name ? ICON_CATALOG[name] : undefined;
  const size = (props.size as string | undefined) || 'md';
  const px = SIZE_MAP[size] || 40;
  const animated = props.animated !== false;
  const label = (props.label as string | undefined) || (meta?.description || name || 'Icon');

  if (!meta) return <div style={{ color: 'var(--p31-text-tertiary)', fontFamily: 'var(--p31-font-mono)', fontSize: 11 }}>unknown icon: {name}</div>;

  const svg = meta.svg
    .replace('<svg', `<svg width="${px}" height="${px}"`)
    .replace('class="', animated ? 'class="a2ui-icon-svg ' : 'class="a2ui-icon-svg a2ui-icon-static ');

  return (
    <div className="a2ui-icon" role="img" aria-label={label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <span dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

function renderComponent(
  comp: A2UIComponent,
  map: Map<string, A2UIComponent>,
  key: string,
  onAction?: A2UIRendererProps['onAction'],
): React.ReactNode {
  const childNodes = resolveChildren(comp.children, map).map((c, i) =>
    renderComponent(c, map, `${key}-${i}`, onAction),
  );
  const label = comp.accessibility?.label;
  const aria = label ? { 'aria-label': label } : {};
  const actionId = comp.props?.actionId as string | undefined;
  const onChange = comp.props?.onChange as string | undefined;

  const handleAction = () => {
    if (!actionId && !onChange) return;
    const id = actionId || onChange;
    onAction?.(id, comp.id, comp.props);
  };

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
    case 'Icon':
      return (
        <div key={key} {...aria}>
          {renderIcon(comp.props, aria)}
        </div>
      );
    case 'Text':
      return (
        <p key={key} {...aria}>
          {label ?? ''}
        </p>
      );
    case 'Button':
      return (
        <button key={key} {...aria} type="button" onClick={handleAction}>
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

export function A2UIRenderer({ message, onAction }: A2UIRendererProps) {
  const version = message.version || 'v0.9';
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
      data-a2ui-version={version}
    >
      {renderComponent(root, map, 'root', onAction)}
    </div>
  );
}

export default A2UIRenderer;
