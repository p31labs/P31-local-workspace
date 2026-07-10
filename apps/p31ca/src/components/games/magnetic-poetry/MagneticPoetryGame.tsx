import { useState, useCallback } from 'react';
import { WordTile } from '../../../engine/magnetic-poetry/types.ts';
import { pickWords } from '../../../engine/magnetic-poetry/words.ts';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

const BOARD_W = 600, BOARD_H = 500;
const TILE_H = 32;

interface Props {
  onScoreChange?: (delta: number) => void;
}

export function MagneticPoetryGame({ onScoreChange }: Props) {
  const [tiles, setTiles] = useState<WordTile[]>(() => pickWords(15));
  const [boardTiles, setBoardTiles] = useState<WordTile[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const nextIdRef = { current: boardTiles.length + tiles.length + 1 };

  const addToBoard = useCallback((tile: WordTile) => {
    setBoardTiles(prev => [...prev, { ...tile, x: 40 + Math.random() * 300, y: 60 + Math.random() * 300 }]);
    setTiles(prev => prev.filter(t => t.id !== tile.id));
    onScoreChange?.(1);
  }, [onScoreChange]);

  const removeFromBoard = useCallback((tile: WordTile) => {
    setTiles(prev => [...prev, { ...tile, x: Math.random() * 400, y: Math.random() * 100 }]);
    setBoardTiles(prev => prev.filter(t => t.id !== tile.id));
  }, []);

  const shuffle = useCallback(() => {
    setTiles(prev => prev.map(t => ({ ...t, x: Math.random() * 400, y: Math.random() * 100 })));
  }, []);

  const addMore = useCallback(() => {
    const used = new Set([...tiles, ...boardTiles].map(t => t.text));
    setTiles(prev => [...prev, ...pickWords(8, used)]);
  }, [tiles, boardTiles]);

  const clearBoard = useCallback(() => {
    setTiles(prev => [...prev, ...boardTiles.map(t => ({ ...t, x: Math.random() * 400, y: Math.random() * 100 }))]);
    setBoardTiles([]);
  }, [boardTiles]);

  const handleMouseDown = (e: React.MouseEvent, tile: WordTile, onBoard: boolean) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging(tile.id);
    setDragOff({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const parent = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - parent.left - dragOff.x;
    const y = e.clientY - parent.top - dragOff.y;
    const update = (t: WordTile) => t.id === dragging ? { ...t, x: Math.max(0, Math.min(BOARD_W - 60, x)), y: Math.max(0, Math.min(BOARD_H - TILE_H, y)) } : t;
    setBoardTiles(prev => prev.map(update));
    setTiles(prev => prev.map(update));
  };

  const handleMouseUp = () => { setDragging(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
      {/* Word bank */}
      <div style={{
        width: BOARD_W, maxWidth: '100%',
        padding: 12, borderRadius: 10,
        background: 'var(--p31-white-2)', border: '1px solid var(--p31-white-6)',
        display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
        minHeight: 60,
      }}>
        {tiles.map(t => (
          <WordChip key={t.id} text={t.text} onClick={() => addToBoard(t)} />
        ))}
        {tiles.length === 0 && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--p31-cloud-20)', padding: 12 }}>
            All words on the board — click one to return it
          </span>
        )}
      </div>

      {/* Board */}
      <div
        style={{
          position: 'relative', width: BOARD_W, height: BOARD_H, maxWidth: '100%',
          borderRadius: 12, border: '2px dashed var(--p31-white-10)',
          background: 'rgba(255,255,255,0.01)', overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {boardTiles.map(t => (
          <div
            key={t.id}
            onMouseDown={e => handleMouseDown(e, t, true)}
            onDoubleClick={() => removeFromBoard(t)}
            style={{
              position: 'absolute', left: t.x, top: t.y,
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--p31-teal-dim)', border: '1px solid var(--p31-teal-dim)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
              color: 'var(--p31-cloud)', cursor: dragging === t.id ? 'grabbing' : 'grab',
              userSelect: 'none', whiteSpace: 'nowrap',
              zIndex: dragging === t.id ? 10 : 1,
              boxShadow: dragging === t.id ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
              transition: dragging === t.id ? 'none' : 'box-shadow 0.15s',
            }}
          >
            {t.text}
          </div>
        ))}
        {boardTiles.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'rgba(232,230,227,0.1)', pointerEvents: 'none',
          }}>
            Click words from the bank above to add them here
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={shuffle} style={btnStyle}>Shuffle Bank</button>
        <button onClick={addMore} style={btnStyle}>More Words</button>
        <button onClick={clearBoard} style={{ ...btnStyle, borderColor: 'var(--p31-rust-border)', color: 'rgba(204,98,71,0.6)' }}>
          Clear Board
        </button>
      </div>
    </div>
  );
}

function WordChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
        background: 'var(--p31-green-dim)', border: '1px solid var(--p31-green-border)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--p31-cloud)',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--p31-green-border)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--p31-green-dim)'; }}
    >
      {text}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px', border: '1px solid var(--p31-white-15)', borderRadius: 6,
  background: 'transparent', color: 'var(--p31-cloud-50)',
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer',
};
