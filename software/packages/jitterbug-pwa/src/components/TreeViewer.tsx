import React, { useEffect, useRef, useState } from 'react';

interface TreeNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  children?: TreeNode[];
  depth?: number;
}

interface TreeViewerProps {
  brainDumpId: string | null;
  apiUrl: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',     // slate-400
  running: '#facc15',     // yellow-400
  completed: '#4ade80',   // green-400
  failed: '#f87171',      // red-400
};

export function TreeViewer({ brainDumpId, apiUrl }: TreeViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brainDumpId || !apiUrl) return;
    setLoading(true);
    setError(null);

    const fetchTree = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/brain-dump/${brainDumpId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const record: any = await res.json();
        
        if (!record.axes_json) {
          setTreeData(null);
          setLoading(false);
          return;
        }

        const axes: any[] = JSON.parse(record.axes_json);
        const root: TreeNode = {
          id: record.id,
          name: record.project_name || 'Brain Dump',
          status: record.status,
          depth: 0,
          children: axes.map((axis: any) => ({
            id: axis.id || axis.letter,
            name: axis.name || `${axis.letter || 'A'} — ${axis.focusArea || axis.agentRole || 'Unknown'}`,
            status: axis.status || 'pending',
            depth: 1,
          })),
        };
        setTreeData(root);
      } catch (err: any) {
        setError(err.message || 'Failed to load tree');
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
    const poll = setInterval(fetchTree, 5000);
    return () => clearInterval(poll);
  }, [brainDumpId, apiUrl]);

  useEffect(() => {
    if (!treeData || !svgRef.current) return;
    renderTree(svgRef.current, treeData);
  }, [treeData]);

  if (!brainDumpId) return null;
  if (loading) return <div className="text-slate-400 text-sm">Loading tree...</div>;
  if (error) return <div className="text-red-400 text-sm">Error: {error}</div>;
  if (!treeData) return <div className="text-slate-400 text-sm">No decomposition data yet.</div>;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded overflow-hidden">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-200">Recursive Decomposition Tree</h3>
        <span className="text-xs text-slate-400">
          {treeData.children?.length || 0} axes · depth {treeData.depth}
        </span>
      </div>
      <div className="p-4 overflow-x-auto">
        <svg
          ref={svgRef}
          width="100%"
          height={Math.max(200, (treeData.children?.length || 0) * 50 + 80)}
          viewBox={`0 0 800 ${Math.max(200, (treeData.children?.length || 0) * 50 + 80)}`}
          className="text-slate-300"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
        />
      </div>
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS.pending }}></span> Pending</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS.running }}></span> Running</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS.completed }}></span> Completed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS.failed }}></span> Failed</span>
      </div>
    </div>
  );
}

interface D3Link {
  source: { x: number; y: number };
  target: { x: number; y: number };
}

function renderTree(svg: SVGSVGElement, root: TreeNode) {
  const width = 800;
  const nodes: Array<{ x: number; y: number; data: TreeNode }> = [];
  const links: D3Link[] = [];

  const rootX = width / 2;
  const rootY = 40;

  nodes.push({ x: rootX, y: rootY, data: root });

  if (root.children && root.children.length > 0) {
    const childY = rootY + 60;
    const spacing = Math.min(120, (width - 80) / root.children.length);
    const startX = (width - (root.children.length - 1) * spacing) / 2;

    root.children.forEach((child, i) => {
      const cx = startX + i * spacing;
      nodes.push({ x: cx, y: childY, data: child });
      links.push({ source: { x: rootX, y: rootY }, target: { x: cx, y: childY } });
    });
  }

  // Render
  const g = svg;
  // Clear previous
  while (g.firstChild) g.removeChild(g.firstChild);

  // Draw links
  links.forEach((link) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(link.source.x));
    line.setAttribute('y1', String(link.source.y));
    line.setAttribute('x2', String(link.target.x));
    line.setAttribute('y2', String(link.target.y));
    line.setAttribute('stroke', '#475569');
    line.setAttribute('stroke-width', '2');
    g.appendChild(line);
  });

  // Draw nodes
  nodes.forEach((node) => {
    const g2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g2.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    // Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '16');
    circle.setAttribute('fill', STATUS_COLORS[node.data.status] || STATUS_COLORS.pending);
    circle.setAttribute('stroke', '#1e293b');
    circle.setAttribute('stroke-width', '2');
    g2.appendChild(circle);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '4');
    text.setAttribute('fill', '#f8fafc');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '600');
    text.textContent = node.data.name.length > 12 ? node.data.name.slice(0, 10) + '…' : node.data.name;
    g2.appendChild(text);

    g.appendChild(g2);
  });
}
