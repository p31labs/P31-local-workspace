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
import { buildGraph } from './graph';

export default function App() {
  const { nodes: rawNodes, edges: rawEdges, counts } = useMemo(() => buildGraph(), []);
  const [focused, setFocused] = useState<string | null>(null);

  const nodes: Node[] = useMemo(
    () =>
      rawNodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data,
        className: `loom-node loom-node--${n.data.kind}`,
      })),
    [rawNodes],
  );

  const edges: Edge[] = useMemo(
    () => rawEdges.map((e) => ({ ...e, className: 'loom-edge' })),
    [rawEdges],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setFocused(node.id);
    // Path α: human focus becomes an event. The dev middleware lands in α3;
    // until then this is a best-effort POST that no-ops.
    void fetch('/api/loom/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node: node.id }),
    }).catch(() => {});
  }, []);

  const focusedNode = rawNodes.find((n) => n.id === focused);

  return (
    <div className="loom-shell">
      <header className="loom-bar">
        <strong>The Loom</strong>
        <span className="loom-counts">
          {counts.tokens} tokens · {counts.cssClasses} classes · {counts.components} component · {counts.themes} themes
        </span>
        <span className="loom-gate">human + agent, one graph</span>
      </header>

      <main className="loom-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
        {focusedNode ? (
          <div>
            <div className={`loom-kind loom-kind--${focusedNode.data.kind}`}>{focusedNode.data.kind}</div>
            <h2>{focusedNode.data.label}</h2>
            <p>{String(focusedNode.data.detail ?? '')}</p>
            <code>{focusedNode.id}</code>
          </div>
        ) : (
          <p className="loom-hint">Click a node. Every node is a real registry entry.</p>
        )}
      </aside>
    </div>
  );
}
