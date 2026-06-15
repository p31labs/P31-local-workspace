import React, { useState, useEffect } from 'react';

export type MemoryGameProps = {
  onBack: () => void;
  reduceSpoons: () => void;
  syncNativeState: () => void;
};

export const MemoryGame = ({
  onBack,
  reduceSpoons,
  syncNativeState,
}: MemoryGameProps) => {
  const emojis = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'];
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  useEffect(() => {
    setCards([...emojis, ...emojis].sort(() => Math.random() - 0.5));
  }, []);

  const handleFlip = async (idx: number) => {
    if (flipped.length >= 2 || flipped.includes(idx) || matched.includes(idx)) {
      return;
    }

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      reduceSpoons();
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setTimeout(async () => {
          setMatched([...matched, ...newFlipped]);
          setFlipped([]);
          try {
            const { mintCreditsNative } = await import('../../lib/tauriBridge');
            await mintCreditsNative('memory_match', 5);
          } catch {
            // ignore
          }
          syncNativeState();
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-8 animate-in fade-in duration-300">
      <h1 className="text-4xl font-extrabold text-cyan-600 mb-8 text-center drop-shadow-sm">Memory</h1>
      <div className="grid grid-cols-3 gap-6 flex-1 content-start">
        {cards.map((c, i) => {
          const isRevealed = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleFlip(i)}
              className={`aspect-square rounded-[2rem] flex items-center justify-center text-7xl shadow-lg transition-all duration-300 ${
                isRevealed
                  ? 'bg-white/90 scale-95 border-2 border-cyan-200'
                  : 'bg-cyan-400/80 backdrop-blur-sm'
              }`}
            >
              {isRevealed ? c : ''}
            </button>
          );
        })}
      </div>
      {matched.length === cards.length && cards.length > 0 && (
        <div className="text-center text-8xl py-8 animate-bounce">🎉⭐</div>
      )}
      <button
        onClick={onBack}
        className="mt-8 py-8 bg-white/60 backdrop-blur-md rounded-[3rem] text-3xl font-bold text-cyan-600 shadow-sm active:scale-95 transition-all"
      >
        BACK
      </button>
    </div>
  );
};

export default MemoryGame;
