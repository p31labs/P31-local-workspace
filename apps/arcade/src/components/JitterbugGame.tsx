import { useRef, useEffect, useState, useCallback } from 'react';
import {
  createJitterbug, tickJitterbug, setJitterbugTarget, jitterbugVertices,
  jitterbugEdges, spoonMorphSpeed, gatedPrimitives,
} from '@p31/game-engine';
import type { JitterbugState } from '@p31/game-engine';

type TargetShape = 'cuboctahedron' | 'icosahedron' | 'octahedron' | 'tetrahedron';
const TARGETS: { shape: TargetShape; phase: number; label: string; love: number }[] = [
  { shape: 'tetrahedron', phase: 1.0, label: 'Tetrahedron (4 vertices)', love: 25 },
  { shape: 'octahedron', phase: 1.0, label: 'Octahedron (6 vertices)', love: 50 },
  { shape: 'cuboctahedron', phase: 0.0, label: 'Cuboctahedron (12 vertices)', love: 100 },
];

function JitterbugCanvas({ spoons, targetPhase, onMatch }: { spoons: number; targetPhase: number; onMatch: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<JitterbugState>(createJitterbug({ spoons, phase: 0 }));
  const targetRef = useRef(targetPhase);
  const matchedRef = useRef(false);

  useEffect(() => { targetRef.current = targetPhase; matchedRef.current = false; }, [targetPhase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 400, h = 400;
    canvas.width = w;
    canvas.height = h;

    const primitives = gatedPrimitives(spoons);
    const showVertices = primitives.allowedTypes.length >= 3;

    let then = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - then) / 1000, 1 / 30);
      then = now;

      const s = stateRef.current;
      if (Math.abs(s.targetPhase - s.phase) < 0.005) {
        stateRef.current = setJitterbugTarget(s, Math.abs(s.targetPhase) < 0.01 ? 1.0 : 0.0, spoons);
      }
      stateRef.current = tickJitterbug(stateRef.current, dt);

      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(70, 70);

      const verts = jitterbugVertices(stateRef.current.phase);
      const edges = jitterbugEdges(stateRef.current.phase);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 0.025;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(verts[a].x, verts[a].y);
        ctx.lineTo(verts[b].x, verts[b].y);
        ctx.stroke();
      }

      if (showVertices) {
        for (const v of verts) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 0.04, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
          ctx.fill();
        }
      }

      // Target indicator — show target vertices in gold
      const targetVerts = jitterbugVertices(targetRef.current);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      for (const v of targetVerts) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 0.05, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Auto-detect match
      if (!matchedRef.current && Math.abs(stateRef.current.phase - targetRef.current) < 0.03) {
        matchedRef.current = true;
        onMatch();
      }

      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [spoons, onMatch]);

  return <canvas ref={canvasRef} style={{ width: 400, height: 400, borderRadius: 16, background: 'rgba(5,5,8,0.9)', border: '1px solid rgba(0,240,255,0.1)' }} />;
}

const SHAPES: TargetShape[] = ['cuboctahedron', 'icosahedron', 'octahedron'];

export default function JitterbugGame() {
  const [spoons, setSpoons] = useState(() => parseInt(localStorage.getItem('p31:spoons') || '3', 10));
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [loveEarned, setLoveEarned] = useState(0);
  const [message, setMessage] = useState('');
  const [targetIdx, setTargetIdx] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout>>();

  const target = TARGETS[targetIdx % TARGETS.length];

  const handleMatch = useCallback(() => {
    setLevel(l => l + 1);
    setScore(s => s + 100);
    setLoveEarned(l => l + target.love);
    setMessage(`✨ Matched! +${target.love} LOVE`);

    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 2000);

    if (level >= 4) {
      setGameOver(true);
    } else {
      setTargetIdx(i => (i + 1) % TARGETS.length);
    }
  }, [level, target.love]);

  const restart = () => {
    setLevel(0); setScore(0); setLoveEarned(0); setMessage(''); setGameOver(false); setTargetIdx(0);
  };

  const color = spoons <= 1 ? '#FB7185' : '#00F0FF';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Jitterbug Puzzle</h2>
        <p style={{ color: 'rgba(245,245,247,0.5)', fontSize: 14, maxWidth: 380 }}>
          Match the {target.label} to earn LOVE. The geometry morphs continuously.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>Spoons</div>
          {([0,1,2,3,4,5] as const).map(s => (
            <button key={s} onClick={() => { setSpoons(s); localStorage.setItem('p31:spoons', String(s)); }}
              style={{
                display: 'inline-block', width: 28, padding: '4px 0', margin: '0 2px 4px', borderRadius: 4, cursor: 'pointer',
                border: spoons === s ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                background: spoons === s ? `${color}20` : 'transparent',
                color: spoons === s ? color : 'rgba(245,245,247,0.4)', fontSize: 11, fontFamily: 'monospace',
              }}>
              {s === 0 ? '!' : s}
            </button>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#FBBF24' }}>Target: {target.label}</div>
          <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.4)' }}>Level {level + 1}/5</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginTop: 4 }}>Score: {score}</div>
          <div style={{ fontSize: 11, color: '#00F0FF' }}>LOVE: {loveEarned}</div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '8px 20px', borderRadius: 8, background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', fontSize: 14, fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      <JitterbugCanvas spoons={spoons} targetPhase={target.phase} onMatch={handleMatch} />

      {gameOver ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FBBF24', marginBottom: 8 }}>Puzzle Complete!</div>
          <div style={{ fontSize: 14, color: 'rgba(245,245,247,0.6)', marginBottom: 4 }}>Score: {score}</div>
          <div style={{ fontSize: 14, color: '#00F0FF', marginBottom: 16 }}>LOVE Earned: {loveEarned}</div>
          <button onClick={restart} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#00F0FF', color: '#0A0A0F', fontWeight: 600, fontSize: 14,
          }}>
            Play Again
          </button>
        </div>
      ) : (
        <p style={{ color: 'rgba(245,245,247,0.3)', fontSize: 11 }}>
          The gold dots show the target shape. Click nothing — just watch as the geometry morphs. You'll earn LOVE when it matches the target.
        </p>
      )}
    </div>
  );
}
