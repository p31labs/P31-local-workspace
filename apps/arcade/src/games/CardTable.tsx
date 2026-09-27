import { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayer } from '../components/PlayerProvider';
import { useGameEngine } from '@p31ca/game-engine/react';
import { jitterbugVertices, jitterbugEdges } from '@p31ca/game-engine';
import { playNote } from './common/sound';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type Card = { suit: Suit; rank: Rank; faceUp: boolean };
type Pile = Card[];

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_COLORS: Record<Suit, string> = { '♠': '#fff', '♥': '#FB7185', '♦': '#FB7185', '♣': '#fff' };
const P31_FREQ = 172.35;

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank, faceUp: false });
  return shuffle(deck);
}

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rankValue(r: Rank): number {
  return RANKS.indexOf(r);
}

function playTone(freq: number, duration: number, vol = 0.1) {
  playNote(freq, duration, vol);
}

export default function CardTable() {
  const { spoons, setSpoons, mintLOVE } = usePlayer();
  const { state, actions } = useGameEngine({
    type: 'cards', spoons,
    onComplete: (data) => { mintLOVE(data.loveEarned, 'cards_game'); },
  });

  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [hand, setHand] = useState<Card[]>([]);
  const [tableau, setTableau] = useState<Pile[]>(() => Array(7).fill(null).map(() => []));
  const [foundations, setFoundations] = useState<Pile[]>(() => Array(4).fill(null).map(() => []));
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [selected, setSelected] = useState<{ type: string; pileIdx: number; cardIdx: number } | null>(null);
  const [message, setMessage] = useState('Select a card to move');
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();

  const showMessage = (msg: string, dur = 2000) => {
    setMessage(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(''), dur);
  };

  useEffect(() => { deal(); }, []);

  const deal = () => {
    const d = createDeck();
    const tab: Pile[] = Array(7).fill(null).map(() => []);
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = d.pop()!;
        tab[i].push({ ...card, faceUp: j === i });
      }
    }
    setTableau(tab);
    setStock(d);
    setHand([]);
    setWaste([]);
    setFoundations(Array(4).fill(null).map(() => []));
    setGameOver(false);
    setSelected(null);
  };

  const handleCardClick = (type: string, pileIdx: number, cardIdx: number) => {
    if (gameOver || state.phase !== 'playing') return;

    if (!selected) {
      if (type === 'waste' && waste.length > 0) {
        setSelected({ type: 'waste', pileIdx: 0, cardIdx: waste.length - 1 });
      } else if (type === 'tab' && tableau[pileIdx] && tableau[pileIdx].length > 0) {
        const topIdx = tableau[pileIdx].length - 1;
        if (tableau[pileIdx][topIdx].faceUp) {
          setSelected({ type: 'tab', pileIdx, cardIdx: topIdx });
        }
      } else if (type === 'found' && foundations[pileIdx] && foundations[pileIdx].length > 0) {
        setSelected({ type: 'found', pileIdx, cardIdx: foundations[pileIdx].length - 1 });
      }
      return;
    }

    const { type: fromType, pileIdx: fromIdx, cardIdx: fromCardIdx } = selected;
    let card: Card | undefined;

    if (fromType === 'waste') card = waste[fromCardIdx];
    else if (fromType === 'tab') card = tableau[fromIdx][fromCardIdx];
    else if (fromType === 'found') card = foundations[fromIdx][fromCardIdx];
    if (!card) { setSelected(null); return; }

    playTone(P31_FREQ, 0.1, 0.04);
    actions.addScore(5);

    if (type === 'found') {
      const found = foundations[pileIdx];
      if (canPlaceOnFoundation(card, found)) {
        removeCard(fromType, fromIdx, fromCardIdx);
        setFoundations(f => { const n = [...f]; n[pileIdx] = [...found, card!]; return n; });
        actions.addLove(10);
        checkWin();
      }
    } else if (type === 'tab') {
      const tab = tableau[pileIdx];
      if (canPlaceOnTableau(card, tab)) {
        removeCard(fromType, fromIdx, fromCardIdx);
        setTableau(t => { const n = [...t]; n[pileIdx] = [...tab, card!]; return n; });
      }
    }

    setSelected(null);
  };

  const removeCard = (type: string, pileIdx: number, cardIdx: number) => {
    if (type === 'waste') setWaste(w => w.slice(0, cardIdx));
    else if (type === 'tab') setTableau(t => { const n = [...t]; n[pileIdx] = n[pileIdx].slice(0, cardIdx); if (n[pileIdx].length > 0 && !n[pileIdx][n[pileIdx].length-1].faceUp) n[pileIdx] = [...n[pileIdx].slice(0, -1), { ...n[pileIdx][n[pileIdx].length-1], faceUp: true }]; return n; });
    else if (type === 'found') setFoundations(f => { const n = [...f]; n[pileIdx] = n[pileIdx].slice(0, cardIdx); return n; });
  };

  const canPlaceOnFoundation = (card: Card, pile: Pile): boolean => {
    if (pile.length === 0) return card.rank === 'A';
    const top = pile[pile.length - 1];
    return top.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1;
  };

  const canPlaceOnTableau = (card: Card, pile: Pile): boolean => {
    if (pile.length === 0) return card.rank === 'K';
    const top = pile[pile.length - 1];
    const isBlack = (s: Suit) => s === '♠' || s === '♣';
    return isBlack(top.suit) !== isBlack(card.suit) && rankValue(card.rank) === rankValue(top.rank) - 1;
  };

  const checkWin = () => {
    if (foundations.every(f => f.length === 13)) {
      setGameOver(true);
      actions.addLove(80);
      actions.complete();
      showMessage('🎉 Solitaire complete! +80 LOVE', 4000);
    }
  };

  const drawFromStock = () => {
    if (gameOver || state.phase !== 'playing') return;
    if (stock.length > 0) {
      const card = stock[stock.length - 1];
      setStock(s => s.slice(0, -1));
      setWaste(w => [...w, { ...card, faceUp: true }]);
      playTone(P31_FREQ, 0.05, 0.02);
    } else if (waste.length > 0) {
      setStock(shuffle(waste.map(c => ({ ...c, faceUp: false }))));
      setWaste([]);
      playTone(P31_FREQ, 0.1, 0.03);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 400; canvas.height = 60;

    const animate = () => {
      ctx.clearRect(0, 0, 400, 60);
      const v = jitterbugVertices(state.jitterbug.phase);
      const e = jitterbugEdges(state.jitterbug.phase);
      ctx.save(); ctx.translate(200, 30); ctx.scale(12, 12);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'; ctx.lineWidth = 0.06;
      for (const [a, b] of e.slice(0, 4)) { ctx.beginPath(); ctx.moveTo(v[a].x, v[a].y); ctx.lineTo(v[b].x, v[b].y); ctx.stroke(); }
      ctx.restore();
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [state.jitterbug.phase]);

  useEffect(() => {
    const jInterval = setInterval(() => actions.updateJitterbug(), 16);
    return () => clearInterval(jInterval);
  }, [actions]);

  const renderCard = (card: Card, onClick: () => void, offset = 0, selected = false) => {
    const color = SUIT_COLORS[card.suit];
    return (
      <div onClick={onClick} key={`${card.suit}-${card.rank}-${offset}`} style={{
        width: 36, height: 52, borderRadius: 4, marginTop: offset * 16, marginLeft: -20,
        background: card.faceUp ? '#1a1a2e' : '#2a2a4e',
        border: selected ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 9, fontFamily: 'monospace', color, flexShrink: 0,
        position: 'relative', zIndex: offset,
      }}>
        {card.faceUp && <><div style={{ fontSize: 10 }}>{card.rank}</div><div style={{ fontSize: 14 }}>{card.suit}</div></>}
        {!card.faceUp && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>?</div>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '24px', maxWidth: 600, margin: '0 auto', overflow: 'auto' }}>
      <div style={{
        padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace',
      }}>
        <span>Solitaire</span>
        <span style={{ color: '#34D399' }}>♥ {state.loveEarned}</span>
        <span style={{ cursor: 'pointer' }} onClick={deal}>🔄 New</span>
      </div>

      {message && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#00F0FF', fontFamily: 'monospace', padding: '4px 0' }}>{message}</div>
      )}

      {/* Jitterbug background */}
      <canvas ref={canvasRef} style={{ width: 400, height: 60, borderRadius: 8, opacity: 0.5 }} />

      {/* Stock + Waste + Foundations */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div onClick={drawFromStock} style={{ cursor: 'pointer' }}>
          <div style={{ width: 36, height: 52, borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: stock.length > 0 ? '#2a2a4e' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{stock.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {waste.slice(-3).map((c, i) => renderCard(c, () => handleCardClick('waste', 0, waste.length - 3 + i), i, selected?.type === 'waste' && selected?.cardIdx === waste.length - 3 + i))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {foundations.map((found, i) => (
            <div key={i} onClick={() => found.length > 0 ? handleCardClick('found', i, found.length - 1) : handleCardClick('found', i, 0)} style={{ cursor: 'pointer' }}>
              {found.length > 0 ? renderCard(found[found.length - 1], () => handleCardClick('found', i, found.length - 1), 0, selected?.type === 'found' && selected?.pileIdx === i) : (
                <div style={{ width: 36, height: 52, borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', overflow: 'auto' }}>
        {tableau.map((pile, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', minWidth: 40, minHeight: 60 }}>
            {pile.length === 0 ? (
              <div onClick={() => handleCardClick('tab', i, 0)} style={{
                width: 36, height: 52, borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
              }} />
            ) : (
              <div style={{ position: 'relative' }}>
                {pile.map((c, j) => (
                  <div key={j} style={{ position: j > 0 ? 'absolute' : 'relative', top: j * 4 }}>
                    {renderCard(c, () => handleCardClick('tab', i, j), 0, selected?.type === 'tab' && selected?.pileIdx === i && selected?.cardIdx === j)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        {([0,1,2,3,4,5] as const).map(s => (
          <button key={s} onClick={() => setSpoons(s)} style={{
            width: 24, padding: '3px 0', borderRadius: 4, cursor: 'pointer',
            border: spoons === s ? `1px solid ${s <= 1 ? '#FB7185' : '#00F0FF'}` : '1px solid rgba(255,255,255,0.1)',
            background: spoons === s ? `${s <= 1 ? '#FB7185' : '#00F0FF'}20` : 'transparent',
            color: spoons === s ? (s <= 1 ? '#FB7185' : '#00F0FF') : 'rgba(255,255,255,0.4)',
            fontSize: 10, fontFamily: 'monospace',
          }}>{s === 0 ? '!' : s}</button>
        ))}
      </div>
    </div>
  );
}
