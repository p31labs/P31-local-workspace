import { useState, useRef, useCallback, useEffect } from 'react';
import {
  createJitterbug,
  tickJitterbug,
  setJitterbugTarget,
  jitterbugVertices,
  jitterbugEdges,
  gatedPrimitives,
  gatedGameConfig,
  gatedChallenges,
  spoonMorphSpeed,
  type JitterbugState,
  type GatedGameConfig,
} from '@p31ca/game-engine';
import { SEED_CHALLENGES } from '@p31ca/game-engine/challenges';
import { TIER_THRESHOLDS } from '@p31ca/game-engine/types';
import type { PlayerTier } from '@p31ca/game-engine';

type GameType = 'jitterbug' | 'collector' | 'builder' | 'cards' | 'sports';
type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';

interface GameDefinition {
  id: string;
  name: string;
  type: GameType;
  spoonsMin: number;
  spoonsMax: number;
  loveCompletion: number;
  loveMilestone: number;
  description: string;
  sizeClass: SizeClass;
  challenges: string[];
}

const GAME_TEMPLATES: Record<GameType, Omit<GameDefinition, 'id' | 'name' | 'description'>> = {
  jitterbug: { type: 'jitterbug', spoonsMin: 2, spoonsMax: 5, loveCompletion: 100, loveMilestone: 20, sizeClass: 'regular', challenges: ['genesis_resonance', 'minimum_system'] },
  collector: { type: 'collector', spoonsMin: 1, spoonsMax: 5, loveCompletion: 50, loveMilestone: 10, sizeClass: 'compact', challenges: ['genesis_resonance'] },
  builder: { type: 'builder', spoonsMin: 2, spoonsMax: 5, loveCompletion: 150, loveMilestone: 25, sizeClass: 'expanded', challenges: ['minimum_system', 'double_bond', 'octet_truss'] },
  cards: { type: 'cards', spoonsMin: 1, spoonsMax: 5, loveCompletion: 75, loveMilestone: 15, sizeClass: 'medium', challenges: [] },
  sports: { type: 'sports', spoonsMin: 2, spoonsMax: 5, loveCompletion: 120, loveMilestone: 30, sizeClass: 'expanded', challenges: [] },
};

const GAME_TYPE_LABELS: Record<GameType, { emoji: string; label: string; desc: string }> = {
  jitterbug: { emoji: '🔺', label: 'Jitterbug', desc: 'Morph cuboctahedron↔tetrahedron. Fuller geometry puzzle.' },
  collector: { emoji: '💎', label: 'LOVE Collector', desc: 'Navigate the mesh, collect care events, avoid burnout.' },
  builder: { emoji: '🏗️', label: 'Geodesic Builder', desc: 'Snap primitives into rigid structures with Maxwell check.' },
  cards: { emoji: '🃏', label: 'Card Table', desc: 'Solitaire, rummy, and P31 originals. DOM-based.' },
  sports: { emoji: '⚾', label: 'Sports', desc: 'Smallball/Gridiron. Markov chains + strategic play.' },
};

const TIERS: PlayerTier[] = ['seedling', 'sprout', 'sapling', 'oak', 'sequoia'];

function JitterbugCanvas({ spoons }: { spoons: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<JitterbugState>(createJitterbug({ spoons, phase: 0 }));
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 200, h = 200;
    canvas.width = w;
    canvas.height = h;

    let then = performance.now();
    const animate = (now: number) => {
      const dt = (now - then) / 1000;
      then = now;

      const state = stateRef.current;
      if (Math.abs(state.targetPhase - state.phase) < 0.01) {
        const newTarget = Math.abs(state.targetPhase - 1) < 0.01 ? 0 : 1;
        stateRef.current = setJitterbugTarget(state, newTarget, spoons);
      }
      stateRef.current = tickJitterbug(stateRef.current, Math.min(dt, 1 / 30));

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(60, 60);

      const verts = jitterbugVertices(stateRef.current.phase);
      const edges = jitterbugEdges(stateRef.current.phase);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 0.03;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(verts[a].x, verts[a].y);
        ctx.lineTo(verts[b].x, verts[b].y);
        ctx.stroke();
      }

      if (stateRef.current.phase <= 0.67) {
        for (const v of verts) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 0.04, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
          ctx.fill();
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spoons]);

  return <canvas ref={canvasRef} style={{ width: 200, height: 200, borderRadius: 12, background: 'rgba(5,5,8,0.8)' }} />;
}

export function GameBuilder() {
  const [gameType, setGameType] = useState<GameType>('jitterbug');
  const [gameName, setGameName] = useState('');
  const [spoonsMin, setSpoonsMin] = useState(2);
  const [spoonsMax, setSpoonsMax] = useState(5);
  const [loveCompletion, setLoveCompletion] = useState(100);
  const [loveMilestone, setLoveMilestone] = useState(20);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(['genesis_resonance', 'minimum_system']);
  const [exportJson, setExportJson] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [previewSpoons, setPreviewSpoons] = useState(3);
  const [previewTier, setPreviewTier] = useState<PlayerTier>('seedling');

  const applyTemplate = (type: GameType) => {
    const tmpl = GAME_TEMPLATES[type];
    setGameType(type);
    setSpoonsMin(tmpl.spoonsMin);
    setSpoonsMax(tmpl.spoonsMax);
    setLoveCompletion(tmpl.loveCompletion);
    setLoveMilestone(tmpl.loveMilestone);
    setSelectedChallenges(tmpl.challenges);
  };

  const toggleChallenge = (id: string) => {
    setSelectedChallenges(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const generate = () => {
    if (!gameName.trim()) { setGenerationError('Game needs a name'); return; }
    setGenerationError('');

    const definition: GameDefinition = {
      id: `${gameType}-${Date.now()}`,
      name: gameName.trim(),
      type: gameType,
      spoonsMin,
      spoonsMax,
      loveCompletion,
      loveMilestone,
      description: GAME_TYPE_LABELS[gameType].desc,
      sizeClass: GAME_TEMPLATES[gameType].sizeClass,
      challenges: selectedChallenges,
    };

    const baseConfig = GAME_TEMPLATES[gameType];
    const gated = gatedGameConfig(spoonsMin, previewTier);

    const project = {
      game: definition,
      engine: {
        primitives: gated.primitives,
        challenges: gatedChallenges(spoonsMin, previewTier).map(gc => gc.challenge.id),
        xpMultiplier: spoonsMin <= 1 ? 2.0 : 1.0,
      },
      LOVE: {
        completion: loveCompletion,
        milestone: loveMilestone,
      },
      scaffold: {
        type: gameType,
        astroVersion: '5.x',
        reactVersion: '19.x',
        deployTarget: 'cloudflare-pages',
      },
      generatedAt: new Date().toISOString(),
    };

    setExportJson(JSON.stringify(project, null, 2));

    // Deploy to API
    setGenerating(true);
    fetch('/api/game/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }).then(r => r.json()).then(d => {
      if (d.error) setGenerationError(d.error);
      setGenerating(false);
    }).catch(e => {
      setGenerationError(e.message || 'Generation failed');
      setGenerating(false);
    });
  };

  const copyExport = () => navigator.clipboard.writeText(exportJson);

  const typeInfo = GAME_TYPE_LABELS[gameType];
  const allChallenges = [...SEED_CHALLENGES];
  const availableAtTier = allChallenges.filter(c => {
    const tierIdx = TIERS.indexOf(c.tier);
    const playerIdx = TIERS.indexOf(previewTier);
    return tierIdx <= playerIdx;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, maxHeight: '60vh', overflow: 'auto' }}>
      {/* Game Type Selector */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(0,240,255,0.4)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
          Game Type
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(Object.entries(GAME_TYPE_LABELS) as [GameType, typeof typeInfo][]).map(([id, info]) => (
            <button
              key={id}
              onClick={() => applyTemplate(id)}
              style={{
                padding: '6px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                border: gameType === id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: gameType === id ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.02)',
                color: gameType === id ? '#00f0ff' : 'rgba(240,242,245,0.5)',
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{info.emoji}</span>
                <span style={{ fontWeight: 600 }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginTop: 2 }}>{info.desc.slice(0, 45)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>Game Name</div>
        <input
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          placeholder={typeInfo.label}
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 11, fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* Spoon Configuration */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(251,191,36,0.4)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Spoon Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>Min Spoons</div>
            <input type="range" min={0} max={5} value={spoonsMin} onChange={e => setSpoonsMin(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24' }} />
            <div style={{ fontSize: 9, color: '#fbbf24', fontFamily: 'monospace' }}>{spoonsMin}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>Max Spoons</div>
            <input type="range" min={0} max={5} value={spoonsMax} onChange={e => setSpoonsMax(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24' }} />
            <div style={{ fontSize: 9, color: '#fbbf24', fontFamily: 'monospace' }}>{spoonsMax}</div>
          </div>
        </div>
      </div>

      {/* LOVE Rewards */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(52,211,153,0.4)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>LOVE Rewards</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>Completion</div>
            <input type="number" min={0} max={1000} value={loveCompletion} onChange={e => setLoveCompletion(Number(e.target.value))}
              style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#34d399', fontSize: 10, fontFamily: 'monospace', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>Milestone</div>
            <input type="number" min={0} max={500} value={loveMilestone} onChange={e => setLoveMilestone(Number(e.target.value))}
              style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#34d399', fontSize: 10, fontFamily: 'monospace', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Preview Spoons</div>
          {([0,1,2,3,4,5] as const).map(s => (
            <button key={s} onClick={() => setPreviewSpoons(s)} style={{
              display: 'block', width: '100%', padding: '2px 8px', marginBottom: 2, borderRadius: 3, cursor: 'pointer',
              border: previewSpoons === s ? '1px solid #00f0ff' : '1px solid transparent',
              background: previewSpoons === s ? 'rgba(0,240,255,0.1)' : 'transparent',
              color: previewSpoons === s ? '#00f0ff' : 'rgba(240,242,245,0.4)', fontSize: 9, fontFamily: 'monospace', textAlign: 'center',
            }}>
              {s}
            </button>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Preview</div>
          <JitterbugCanvas spoons={previewSpoons} />
          <div style={{ marginTop: 4, fontSize: 8, color: 'rgba(240,242,245,0.2)', fontFamily: 'monospace', textAlign: 'center' }}>
            cuboctahedron ↔ tetrahedron
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', marginBottom: 2 }}>Player Tier</div>
            <select value={previewTier} onChange={e => setPreviewTier(e.target.value as PlayerTier)}
              style={{ width: '100%', padding: '3px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#f0f2f5', fontSize: 10, fontFamily: 'monospace' }}>
              {TIERS.map(t => <option key={t} value={t}>{t} ({TIER_THRESHOLDS[t]} XP)</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Engine State</div>
          <div style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.6 }}>
            {(() => {
              const g = gatedPrimitives(previewSpoons);
              const gConfig = gatedGameConfig(previewSpoons, previewTier);
              return (
                <div style={{ color: 'rgba(240,242,245,0.5)' }}>
                  <div>Primitives: <span style={{ color: '#34d399' }}>{g.allowedTypes.join(', ')}</span></div>
                  <div>Max pieces: <span style={{ color: '#00f0ff' }}>{g.maxPieces}</span></div>
                  <div>Snap tol: <span style={{ color: '#00f0ff' }}>{g.snapTolerance}</span></div>
                  <div>Challenges: <span style={{ color: '#fbbf24' }}>{gConfig.availableChallenges.length}</span></div>
                  <div>Motion: <span style={{ color: gConfig.motionEnabled ? '#34d399' : '#fb7185' }}>{gConfig.motionEnabled ? 'enabled' : 'disabled'}</span></div>
                  <div>Auto-pause: {gConfig.autoPauseInterval > 0 ? `${gConfig.autoPauseInterval / 1000}s` : 'off'}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div>
        <div style={{ fontSize: 9, color: 'rgba(139,92,246,0.4)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
          Seed Challenges ({selectedChallenges.length} selected)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {availableAtTier.map(c => {
            const sel = selectedChallenges.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleChallenge(c.id)} style={{
                padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                border: sel ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: sel ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                color: sel ? '#a78bfa' : 'rgba(240,242,245,0.4)', fontSize: 9,
              }}>
                {c.title} ({c.tier})
              </button>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>Export</span>
          <button onClick={generate} disabled={generating} style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(0,240,255,0.3)', cursor: generating ? 'default' : 'pointer',
            background: generating ? 'rgba(0,240,255,0.03)' : 'rgba(0,240,255,0.08)',
            color: generating ? 'rgba(0,240,255,0.3)' : '#00f0ff', fontSize: 10, fontWeight: 600,
          }}>
            {generating ? 'Generating...' : '🚀 Generate'}
          </button>
          {exportJson && (
            <button onClick={copyExport} style={{
              padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(52,211,153,0.2)', cursor: 'pointer',
              background: 'rgba(52,211,153,0.06)', color: '#34d399', fontSize: 9,
            }}>
              Copy JSON
            </button>
          )}
        </div>
        {generationError && (
          <div style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', color: '#fb7185', fontSize: 9, marginBottom: 6 }}>
            {generationError}
          </div>
        )}
        {exportJson && (
          <pre style={{
            padding: '8px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#818cf8', fontSize: 10, fontFamily: 'var(--p31-font-mono, monospace)',
            maxHeight: 120, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap',
          }}>
            {exportJson}
          </pre>
        )}
      </div>
    </div>
  );
}

export default GameBuilder;
