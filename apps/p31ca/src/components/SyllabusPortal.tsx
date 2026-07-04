import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SYLLABUS } from '../data/syllabus';
import type { SyllabusVolume } from '../data/syllabus';

type SpoonLevel = 1 | 3 | 6;

interface ThemeConfig {
  bg: string;
  text: string;
  container: string;
  header: string;
  card: string;
  title: string;
  body: string;
  hideExtra: boolean;
}

const getThemeClasses = (spoonLevel: SpoonLevel): ThemeConfig => {
  switch (spoonLevel) {
    case 1:
      return {
        bg: "bg-white",
        text: "text-black",
        container: "max-w-3xl mx-auto p-6",
        header: "text-4xl font-black tracking-tight mb-8",
        card: "bg-gray-100 p-8 rounded-3xl mb-6 shadow-sm border-4 border-black transition-all",
        title: "text-3xl font-bold mb-4",
        body: "text-2xl leading-relaxed font-medium",
        hideExtra: true,
      };
    case 3:
      return {
        bg: "bg-zinc-950",
        text: "text-zinc-200",
        container: "max-w-4xl mx-auto p-8",
        header: "text-3xl font-serif font-light tracking-widest text-center mb-12 uppercase text-zinc-100",
        card: "bg-zinc-900/50 p-8 rounded-xl mb-8 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 transition-all shadow-2xl",
        title: "text-2xl font-serif mb-3 text-white flex items-center gap-3",
        body: "text-lg leading-loose text-zinc-400 font-light",
        hideExtra: false,
      };
    case 6:
      return {
        bg: "bg-black",
        text: "text-emerald-500",
        container: "max-w-6xl mx-auto p-4 font-mono",
        header: "text-xl font-bold tracking-tighter border-b border-emerald-900 pb-4 mb-8",
        card: "bg-black p-6 mb-4 border border-emerald-900 hover:bg-emerald-950/20 transition-all",
        title: "text-xl font-bold mb-2 uppercase tracking-widest flex items-center gap-2",
        body: "text-sm leading-relaxed",
        hideExtra: false,
      };
  }
};

export default function SyllabusPortal() {
  const [spoonLevel, setSpoonLevel] = useState<SpoonLevel>(3);
  const [activeVolume, setActiveVolume] = useState<number>(1);
  const [showVIP, setShowVIP] = useState(false);

  const theme = getThemeClasses(spoonLevel);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      {/* TOP NAVIGATION & SPOON DIAL */}
      <div className="sticky top-0 z-50 backdrop-blur-md border-b border-current/10 bg-inherit">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold tracking-widest uppercase text-sm">
            P31 // Sovereign Edge
          </div>

          {/* THE SPOON DIAL */}
          <div className="flex items-center gap-3 bg-current/5 p-1 rounded-full border border-current/10">
            <span className="text-xs font-bold uppercase pl-3 opacity-70">Cognitive Load:</span>
            {([1, 3, 6] as SpoonLevel[]).map((spoons) => (
              <button
                key={spoons}
                onClick={() => {
                  setSpoonLevel(spoons);
                  setShowVIP(false);
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  spoonLevel === spoons
                    ? 'bg-current text-white invert'
                    : 'hover:bg-current/10 opacity-50'
                }`}
              >
                {spoons} Spoon{spoons > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={theme.container}>
        {/* HEADER */}
        <h1 className={theme.header}>
          {spoonLevel === 1
            ? "The P31 Handbook."
            : "The P31 Center For Family Members Who Can't Tech Good"}
        </h1>

        {spoonLevel === 3 && (
          <p className="text-center italic text-zinc-500 mb-12">
            "And wanna learn to do other stuff good too."
          </p>
        )}

        {/* VOLUME TABS */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {SYLLABUS.map((vol: SyllabusVolume) => (
            <button
              key={vol.id}
              onClick={() => {
                setActiveVolume(vol.id);
                setShowVIP(false);
              }}
              className={`px-6 py-3 border transition-all text-sm uppercase tracking-widest font-bold ${
                activeVolume === vol.id
                  ? 'border-current bg-current text-white invert'
                  : 'border-current/20 hover:border-current/50 opacity-60'
              } ${
                spoonLevel === 1
                  ? 'rounded-2xl'
                  : spoonLevel === 3
                    ? 'rounded-none'
                    : 'rounded-sm'
              }`}
            >
              Vol. {vol.id}
            </button>
          ))}
        </div>

        {/* CONTENT RENDERER */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {SYLLABUS.filter((v: SyllabusVolume) => v.id === activeVolume).map(
            (volume: SyllabusVolume) => (
              <div key={volume.id}>
                <h2
                  className={`mb-8 uppercase tracking-widest opacity-50 ${
                    spoonLevel === 1 ? 'text-2xl font-bold' : 'text-sm'
                  }`}
                >
                  {volume.volume}
                </h2>

                {volume.modules.map((mod) => {
                  const IconComponent = mod.icon;
                  return (
                    <div key={mod.id} className={theme.card}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={theme.title}>
                          {!theme.hideExtra && (
                            <span className="opacity-50">
                              <IconComponent size={24} />
                            </span>
                          )}
                          {spoonLevel !== 1 && (
                            <span className="opacity-50 mr-2">
                              MOD {mod.id} //
                            </span>
                          )}
                          {mod.title}
                        </h3>

                        {/* HACKER/MAGNUM METADATA (Only visible in 6-spoon mode) */}
                        {spoonLevel === 6 && (
                          <div className="text-right text-xs opacity-70">
                            <div>CLASS: {mod.classification}</div>
                            <div>DIFF: {mod.difficulty}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div>
                          {!theme.hideExtra && (
                            <h4 className="text-xs uppercase font-bold tracking-widest opacity-50 mb-2">
                              Executive Summary
                            </h4>
                          )}
                          <p className={theme.body}>{mod.summary}</p>
                        </div>

                        {/* HIDE THE COMPLEX ARCHITECTURE IF ONLY 1 SPOON */}
                        {!theme.hideExtra && (
                          <div className="pt-4 border-t border-current/10">
                            <h4 className="text-xs uppercase font-bold tracking-widest opacity-50 mb-2">
                              Architectural Truth
                            </h4>
                            <p className={theme.body}>{mod.core}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* THE GRAND FINALE (Only in Volume 3) */}
          {activeVolume === 3 && (
            <div className="mt-12 text-center">
              {!showVIP ? (
                <button
                  onClick={() => setShowVIP(true)}
                  className={`group relative inline-flex items-center justify-center px-8 py-4 font-bold tracking-widest uppercase overflow-hidden transition-all ${
                    spoonLevel === 1
                      ? 'bg-black text-white text-2xl rounded-full w-full'
                      : spoonLevel === 3
                        ? 'bg-zinc-100 text-black rounded hover:bg-white'
                        : 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-900/30'
                  }`}
                >
                  <span className="mr-2">Initiate Ignition Sequence</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div
                  className={`p-8 animate-in zoom-in duration-500 ${
                    spoonLevel === 1
                      ? 'bg-black text-white rounded-3xl'
                      : spoonLevel === 3
                        ? 'bg-zinc-900 border border-zinc-700 rounded-xl'
                        : 'border border-emerald-500 bg-black'
                  }`}
                >
                  <h3
                    className={`mb-6 uppercase tracking-widest font-bold ${
                      spoonLevel === 1 ? 'text-3xl' : 'text-xl'
                    }`}
                  >
                    Welcome to the Delta
                  </h3>

                  {/* FAKE QR CODE FOR AESTHETICS */}
                  <div className="w-48 h-48 mx-auto mb-6 bg-white p-2 relative">
                    <div className="grid grid-cols-7 grid-rows-7 gap-0.5 w-full h-full">
                      {Array.from({ length: 49 }).map((_, i) => {
                        const row = Math.floor(i / 7);
                        const col = i % 7;
                        const isCorner =
                          (row < 3 && col < 3) ||
                          (row < 3 && col >= 4) ||
                          (row >= 4 && col < 3);
                        const filled = isCorner
                          ? true
                          : Math.random() > 0.45;
                        return (
                          <div
                            key={i}
                            className={`${
                              filled ? 'bg-black' : 'bg-white'
                            } ${isCorner ? 'border border-gray-300' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <p
                    className={`${
                      spoonLevel === 1 ? 'text-2xl' : 'text-sm'
                    } opacity-80 uppercase tracking-widest`}
                  >
                    Non-Exportable Ed25519 Key Generated.
                    <br />
                    PGLite Schema Hydrated.
                    <br />
                    <span className="font-bold mt-4 block">
                      The ropes are open.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
