import React, { useState, useEffect, useCallback, useRef } from 'react';

interface MeshNode {
  id: string;
  name: string;
  type: 'hub' | 'device' | 'edge' | 'relay';
  status: 'online' | 'degraded' | 'offline';
  pingMs: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface MeshEdge {
  source: string;
  target: string;
  latencyMs: number;
  active: boolean;
}

const INITIAL_NODES: MeshNode[] = [
  { id: 'phos', name: 'PHOS Core', type: 'hub', status: 'online', pingMs: 0 },
  { id: 'node-zero', name: 'Node Zero', type: 'device', status: 'offline', pingMs: -1 },
  { id: 'bash-tab', name: 'Bash Tab', type: 'device', status: 'offline', pingMs: -1 },
  { id: 'willow-tab', name: 'Willow Tab', type: 'device', status: 'offline', pingMs: -1 },
  { id: 'cf-edge', name: 'CF Edge', type: 'edge', status: 'online', pingMs: 12 },
  { id: 'relay-1', name: 'Family Relay', type: 'relay', status: 'online', pingMs: 34 },
];

export function ConnectionGridSurface({ theme, spoons }: { theme: Record<string, string>; spoons: number }) {
  const [nodes, setNodes] = useState<MeshNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<MeshEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodePositions = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());

  const getNodeColor = useCallback((node: MeshNode) => {
    if (node.status === 'online') return '#34d399';
    if (node.status === 'degraded') return '#fbbf24';
    return '#6b7280';
  }, []);

  const getNodeRadius = useCallback((node: MeshNode) => {
    if (node.type === 'hub') return 24;
    if (node.type === 'edge') return 18;
    if (node.type === 'relay') return 16;
    return 12;
  }, []);

  // Simple force simulation on canvas
  /* v8 ignore start */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 300;

    // Initialize positions
    const centerX = W / 2;
    const centerY = H / 2;
    nodes.forEach((node, i) => {
      if (!nodePositions.current.has(node.id)) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = node.type === 'hub' ? 0 : 80 + Math.random() * 60;
        nodePositions.current.set(node.id, {
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        });
      }
    });

    let frame = 0;
    function simulate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const positions = nodePositions.current;

      // Simple force: hub attracts, nodes repel
      for (const [id, pos] of positions) {
        if (id === 'phos') continue;
        const hub = positions.get('phos');
        if (!hub) continue;

        // Attraction to hub
        const dx = hub.x - pos.x;
        const dy = hub.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        pos.vx += (dx / dist) * 0.02;
        pos.vy += (dy / dist) * 0.02;

        // Repulsion from other nodes
        for (const [otherId, otherPos] of positions) {
          if (otherId === id) continue;
          const rdx = pos.x - otherPos.x;
          const rdy = pos.y - otherPos.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
          if (rdist < 60) {
            pos.vx += (rdx / rdist) * 0.5;
            pos.vy += (rdy / rdist) * 0.5;
          }
        }

        // Damping + integrate
        pos.vx *= 0.9;
        pos.vy *= 0.9;
        pos.x += pos.vx;
        pos.y += pos.vy;

        // Bounds
        pos.x = Math.max(30, Math.min(W - 30, pos.x));
        pos.y = Math.max(30, Math.min(H - 30, pos.y));
      }

      // Draw edges
      for (let i = 1; i < nodes.length; i++) {
        const src = positions.get('phos')!;
        const tgt = positions.get(nodes[i].id);
        if (!tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = nodes[i].status === 'online' ? 'rgba(52,211,153,0.3)' : 'rgba(107,114,128,0.15)';
        ctx.lineWidth = nodes[i].status === 'online' ? 2 : 1;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;
        const r = getNodeRadius(node);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = getNodeColor(node);
        ctx.globalAlpha = node.status === 'offline' ? 0.4 : 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, pos.x, pos.y + r + 12);
      }

      frame++;
      animRef.current = requestAnimationFrame(simulate);
    }

    simulate();
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, getNodeColor, getNodeRadius]);

  // Poll edge status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Simulate ping measurements
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === 'phos') return n;
            if (n.type === 'device' && n.status === 'offline') return n;
            return { ...n, pingMs: Math.max(1, n.pingMs + Math.floor(Math.random() * 10 - 5)) };
          })
        );

        setEdges([
          { source: 'phos', target: 'cf-edge', latencyMs: 12, active: true },
          { source: 'phos', target: 'relay-1', latencyMs: 34, active: true },
          ...nodes.filter((n) => n.status === 'online' && n.id !== 'phos').map((n) => ({
            source: 'phos' as string,
            target: n.id,
            latencyMs: n.pingMs,
            active: true,
          })),
        ]);
      } catch { /* */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [nodes]);
  /* v8 ignore stop */

  const selected = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">CONNECTION_GRID // MESH_TOPOLOGY</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400">
            {nodes.filter((n) => n.status === 'online').length}/{nodes.length} ONLINE
          </span>
          <span className="text-[10px] font-mono rounded px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 animate-pulse">
            LIVE
          </span>
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-[300px] rounded-xl bg-black/20 border border-white/5" />
      </div>

      {selected && (
        <div className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-emerald-400">{selected.name}</span>
            <span className={`text-[10px] font-mono ${selected.status === 'online' ? 'text-emerald-400' : 'text-gray-400'}`}>
              {selected.status.toUpperCase()}
            </span>
          </div>
          {selected.pingMs >= 0 && (
            <span className="text-[10px] font-mono opacity-40">Ping: {selected.pingMs}ms</span>
          )}
          <span className="text-[10px] font-mono opacity-30">Type: {selected.type}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            className={`p-2 rounded-lg border text-left transition-all ${
              node.id === selectedNode
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-white/5 bg-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(node) }} />
              <span className="text-[10px] font-mono truncate">{node.name}</span>
            </div>
          </button>
        ))}
      </div>

      {edges.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase opacity-30">Edge Latencies</span>
          {edges.filter((e) => e.active).map((edge, i) => (
            <div key={i} className="flex justify-between text-[10px] font-mono opacity-40">
              <span>{edge.source} → {edge.target}</span>
              <span>{edge.latencyMs}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
