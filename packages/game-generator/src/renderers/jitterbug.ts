import type { GameDefinition } from '../schema.js';

export function renderJitterbug(def: GameDefinition): string {
  const { id, name, spoonsMin, spoonsMax, loveCompletion, loveMilestone } = def.game;
  const { initial, states } = def.stateMachine;

  const stateTransitions = Object.entries(states).reduce((acc, [state, val]) => {
    acc[state] = val.on;
    return acc;
  }, {} as Record<string, Record<string, string>>);

  return `
import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameEngine } from '@p31ca/game-engine/react';
import { jitterbugVertices, jitterbugEdges } from '@p31ca/game-engine';

const GAME_ID = '${id}';
const LOVE_COMPLETION = ${loveCompletion};
const LOVE_MILESTONE = ${loveMilestone};

export default function JitterbugGame() {
  const [spoons, setSpoons] = useState(${spoonsMin});
  const [loveEarned, setLoveEarned] = useState(0);
  const { state, actions } = useGameEngine({
    type: 'jitterbug',
    spoons,
    onComplete: (data) => {
      setLoveEarned(e => e + (data.loveEarned || 0));
    },
  });

  const [score, setScore] = useState(0);
  const [targetPhase, setTargetPhase] = useState(Math.random());
  const [phase, setPhase] = useState(0);
  const [matched, setMatched] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const [gameState, setGameState] = useState('${initial}');

  const handleEvent = (event: string) => {
    const next = ${JSON.stringify(stateTransitions)}[gameState]?.[event];
    if (next) setGameState(next);
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = 400, h = 400;
    c.width = w; c.height = h;

    let phaseVal = 0;
    const step = 0.005 * (spoons / 3 + 0.5);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 280);
      bg.addColorStop(0, '#0d0d1a');
      bg.addColorStop(1, '#050508');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      phaseVal = (phaseVal + step) % 1;
      setPhase(phaseVal);
      const verts = jitterbugVertices(phaseVal);
      const edges = jitterbugEdges(phaseVal);
      const targetVerts = jitterbugVertices(targetPhase);

      ctx.save(); ctx.translate(w/2, h/2); ctx.scale(45, 45);
      ctx.shadowColor = 'rgba(251,191,36,0.3)'; ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(251,191,36,0.15)'; ctx.lineWidth = 0.04;
      for (const [a,b] of edges) {
        const va = targetVerts[Math.min(a, targetVerts.length-1)];
        const vb = targetVerts[Math.min(b, targetVerts.length-1)];
        if (!va || !vb) continue;
        ctx.beginPath(); ctx.moveTo(va.x, va.y); ctx.lineTo(vb.x, vb.y); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.save(); ctx.translate(w/2, h/2); ctx.scale(45, 45);
      ctx.shadowColor = '#00F0FF'; ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(0,240,255,0.4)'; ctx.lineWidth = 0.03;
      for (const [a,b] of edges) {
        const va = verts[Math.min(a, verts.length-1)];
        const vb = verts[Math.min(b, verts.length-1)];
        if (!va || !vb) continue;
        ctx.beginPath(); ctx.moveTo(va.x, va.y); ctx.lineTo(vb.x, vb.y); ctx.stroke();
      }
      for (const v of verts) {
        ctx.beginPath(); ctx.arc(v.x, v.y, 0.03, 0, Math.PI*2);
        ctx.fillStyle = '#00F0FF';
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [spoons, targetPhase]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const diff = Math.abs(phase - targetPhase);
    if (diff < 0.05 && !matched) {
      setMatched(true);
      setScore(s => s + 10);
      setLoveEarned(e => e + LOVE_MILESTONE);
      setTimeout(() => {
        setTargetPhase(Math.random());
        setMatched(false);
        if (score >= 100) {
          setLoveEarned(e => e + LOVE_COMPLETION);
          actions.complete();
        }
      }, 500);
    }
  }, [phase, targetPhase, matched, score, actions, gameState]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      padding: '24px',
      maxWidth: 440,
      margin: '0 auto',
      fontFamily: 'monospace',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: 400,
          height: 400,
          borderRadius: 16,
          border: '1px solid rgba(0,240,255,0.15)',
          boxShadow: '0 0 30px rgba(0,240,255,0.08)',
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        fontFamily: 'monospace',
        color: '#00F0FF',
        fontSize: 14,
      }}>
        <span>Score: {score}</span>
        <span>♥ {loveEarned}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {([0,1,2,3,4,5] as const).map(s => (
          <button
            key={s}
            onClick={() => setSpoons(s)}
            style={{
              width: 32,
              padding: '4px 0',
              borderRadius: 4,
              cursor: 'pointer',
              border: spoons === s ? \`1px solid \${s <= 1 ? '#FB7185' : '#00F0FF'}\` : '1px solid rgba(255,255,255,0.1)',
              background: spoons === s ? \`\${s <= 1 ? '#FB7185' : '#00F0FF'}20\` : 'transparent',
              color: spoons === s ? (s <= 1 ? '#FB7185' : '#00F0FF') : 'rgba(255,255,255,0.4)',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {s === 0 ? '!' : s}
          </button>
        ))}
      </div>
    </div>
  );
}
`;
}
