import { HolographicD20 } from './HolographicD20';
import GeodesicSeal from './GeodesicSeal';
import { useState } from 'react';

function getDownloadUrl(paper) {
  if (!paper?.filename) return '#';
  const name = paper.filename.split('/').pop() || paper.filename;
  return `/omnibus/${encodeURIComponent(name)}`;
}

export default function OmnibusD20({ papers }) {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [sealUnlocked, setSealUnlocked] = useState(false);

  const handleSelect = (id) => {
    if (!sealUnlocked) {
      console.warn('ACCESS DENIED: Roll for Sovereignty first.');
      return;
    }
    const paper = papers.find(p => p.id === id);
    if (!paper) return;
    setSelectedPaper(paper);
    console.log(`Decrypting Paper ${id}: ${paper.title}`);
  };

  return (
    <div
      className={`flex flex-col items-center gap-12 p-8 bg-[#050510] rounded-3xl border border-cyan-500/20 transition-shadow duration-1000 ${
        sealUnlocked
          ? 'ring-1 ring-cyan-400/25 shadow-[0_0_48px_rgba(0,200,255,0.12)]'
          : ''
      }`}
    >
      <div className="text-center">
        <h2 className="text-cyan-400 font-mono tracking-widest text-xl">P31 OMNIBUS</h2>
        <p className="text-gray-500 text-xs mt-2 italic">
          {sealUnlocked
            ? 'Geometry locked. Icosahedron (1–20) or core lattice (21–25).'
            : 'Awaiting jurisdictional validation.'}
        </p>
      </div>

      <div
        className={`transition-opacity duration-1000 ${
          sealUnlocked ? 'opacity-100' : 'opacity-30 pointer-events-none'
        }`}
      >
        <HolographicD20
          activeId={selectedPaper && selectedPaper.id <= 20 ? selectedPaper.id : null}
          onSelect={handleSelect}
        />
      </div>

      {sealUnlocked && (
        <div className="w-full max-w-2xl -mt-4">
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-red-500/50 mb-3">
            Core lattice
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {papers.slice(20).map((paper) => {
              const active = selectedPaper?.id === paper.id;
              return (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => {
                    setSelectedPaper(paper);
                    console.log(`Stellar node ${paper.id}: ${paper.title}`);
                  }}
                  className={`px-3 py-1.5 rounded border font-mono text-[10px] transition-all
                    ${
                      active
                        ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_14px_rgba(220,50,50,0.35)] z-10'
                        : 'bg-black/50 border-red-900/45 text-red-500/90 hover:border-red-500/70 hover:text-red-400'
                    }`}
                >
                  NODE {paper.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedPaper && sealUnlocked ? (
        <div className="glass p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-red-500 font-bold tracking-tighter text-lg">
            PAPER {selectedPaper.id}: {selectedPaper.title}
          </h3>
          <p className="text-gray-400 text-xs mt-2 font-mono">DOI: {selectedPaper.doi}</p>
          <a
            href={getDownloadUrl(selectedPaper)}
            download
            className="mt-4 block text-center w-full bg-cyan-950 border border-cyan-400 text-cyan-400 py-2 font-black text-xs uppercase hover:bg-cyan-900 transition-colors"
          >
            DOWNLOAD FORGED ARTIFACT
          </a>
        </div>
      ) : (
        <div
          className={
            sealUnlocked
              ? 'scale-90 opacity-60 pointer-events-none transition-all duration-1000'
              : 'transition-all duration-1000'
          }
        >
          <GeodesicSeal onNatural20={() => setSealUnlocked(true)} />
        </div>
      )}
    </div>
  );
}
