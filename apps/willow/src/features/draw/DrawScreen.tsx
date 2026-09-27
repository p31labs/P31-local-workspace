/**
 * @file DrawScreen.tsx — WILLOW canvas drawing (genesis).
 * Colors, brush size, eraser, undo, clear, save. Ported from prototype.
 * Canvas fillStyle literals are required (canvas has no var() access).
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { GlassCard, GlowButton } from '@p31ca/ui/chrome';
import { useWillowStore } from '../../store/willowStore';

const COLORS = ['#34d399', '#00f0ff', '#a78bfa', '#fbbf24', '#fb7185', '#f0f2f5', '#f97316', '#ec4899', '#60a5fa', '#84cc16'];

export function DrawScreen() {
  const { earnLove } = useWillowStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const [color, setColor] = useState('#34d399');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    ctx.fillStyle = '#070d0a'; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const getPos = (e: any, c: HTMLCanvasElement) => {
    const rect = c.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (c.width / rect.width), y: (src.clientY - rect.top) * (c.height / rect.height) };
  };

  const startDraw = useCallback((e: any) => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (undoStack.current.length > 12) undoStack.current.shift();
    isDrawing.current = true;
    lastPos.current = getPos(e, c);
  }, []);

  const draw = useCallback((e: any) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const pos = getPos(e, c);
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    if (!hasDrawn) { setHasDrawn(true); earnLove(5); }
  }, [color, brushSize, tool, hasDrawn, earnLove]);

  const stopDraw = useCallback(() => { isDrawing.current = false; }, []);
  const undo = () => {
    if (!undoStack.current.length) return;
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')!.putImageData(undoStack.current.pop()!, 0, 0);
  };
  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    undoStack.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.fillStyle = '#070d0a'; ctx.fillRect(0, 0, c.width, c.height);
  };
  const saveDrawing = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement('a');
    a.download = `willow-art-${Date.now()}.png`;
    a.href = c.toDataURL();
    a.click();
    earnLove(10);
  };

  return (
    <div className="flex flex-col gap-2.5 h-full animate-[fadeUp_0.22s_ease-out]">
      <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
        <div className="flex gap-1 items-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('brush'); }}
              style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${color === c && tool === 'brush' ? '#fff' : 'rgba(255,255,255,0.1)'}`, transition: 'border 0.1s', minWidth: 22, minHeight: 22, cursor: 'pointer' }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <span style={{ fontSize: 10, color: 'var(--p31-text-secondary)' }}>Size</span>
          <input type="range" min={1} max={24} value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} style={{ width: 70, accentColor: '#34d399' }} aria-label="Brush size" />
        </div>
        <GlowButton color={tool === 'eraser' ? 'rose' : 'green'} size="sm" onClick={() => setTool((t) => (t === 'eraser' ? 'brush' : 'eraser'))}>⬜</GlowButton>
        <GlowButton color="cyan" size="sm" onClick={undo}>↩</GlowButton>
        <GlowButton color="rose" size="sm" onClick={clear}>🗑</GlowButton>
        <GlowButton color="green" size="sm" onClick={saveDrawing}>💾 Save</GlowButton>
      </div>
      <GlassCard className="flex-1 relative overflow-hidden p-0" style={{ minHeight: 200, borderRadius: 12, border: '1px solid rgba(52,211,153,0.12)' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        {!hasDrawn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: 'rgba(52,211,153,0.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
              <div style={{ fontSize: 12 }}>Touch here to draw</div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
