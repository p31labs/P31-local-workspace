import React, { useState } from 'react';

export default function GeodesicSeal({ onNatural20 }) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);

  const rollSovereignty = () => {
    setRolling(true);
    setTimeout(() => {
      setResult(20);
      setRolling(false);
      if (typeof onNatural20 === 'function') onNatural20();
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 bg-black rounded-[3rem] border border-cyan-900/50 shadow-2xl">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {rolling ? (
          <div className="animate-spin-slow">
            <div className="w-24 h-24 text-yellow-500 opacity-50 animate-spin">
              ◆
            </div>
          </div>
        ) : result === 20 ? (
          <div className="w-40 h-40 bg-cyan-400 text-black rounded-xl shadow-[0_0_50px_cyan] flex items-center justify-center transform rotate-45 border-4 border-white">
            <span className="text-7xl font-black italic transform -rotate-45">20</span>
          </div>
        ) : (
          <button type="button" onClick={rollSovereignty} className="group p-8 border-4 border-dashed border-cyan-900 rounded-full hover:border-cyan-400 transition-all">
            <div className="w-16 h-16 text-cyan-400 group-hover:scale-110 transition-transform flex items-center justify-center">
              ◇
            </div>
          </button>
        )}
      </div>
      <h2 className="text-sm font-black tracking-[0.4em] uppercase text-gray-500">
        {rolling
          ? 'Verifying Isostatic Rigidity...'
          : result === 20
            ? 'NATURAL 20: GEOMETRY LOCKED'
            : 'ROLL FOR SOVEREIGNTY'}
      </h2>
    </div>
  );
}
