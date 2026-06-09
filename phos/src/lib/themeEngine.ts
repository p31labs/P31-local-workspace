export function getBiologicalTheme(spoons: number, grayRock: boolean) {
  if (grayRock || spoons === 0) {
    return {
      name: 'CRISIS',
      wrapper: 'bg-black text-gray-500 font-mono tracking-tight select-none',
      orb: 'bg-gray-800 shadow-none animate-none scale-90',
      button: 'bg-gray-900 border border-gray-800 text-gray-500 rounded-sm backdrop-blur-none transition-none',
      hud: 'bg-black/90 border border-gray-800 rounded-none',
      input: 'bg-gray-900 border-gray-800 text-gray-500 rounded-none pointer-events-none',
      container: 'max-w-xl mx-auto p-4 border border-gray-900 bg-black',
    };
  }
  if (spoons <= 2) {
    return {
      name: 'SANCTUARY',
      wrapper: 'bg-slate-950 text-orange-50 font-sans tracking-normal bg-gradient-to-b from-orange-950/20 via-slate-950 to-rose-950/20',
      orb: 'bg-gradient-to-tr from-amber-400 to-rose-400 shadow-[0_0_60px_rgba(251,146,60,0.35)] animate-biomimetic-breath',
      button: 'bg-white/10 hover:bg-white/15 border border-white/10 text-orange-100 rounded-full shadow-md backdrop-blur-md active:scale-98 transition-all duration-300',
      hud: 'bg-orange-950/30 backdrop-blur-xl border border-orange-900/40 rounded-3xl shadow-xl',
      input: 'bg-orange-950/20 border border-orange-900/30 text-orange-100 rounded-full backdrop-blur-md focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all duration-300',
      container: 'max-w-4xl mx-auto p-8 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-md shadow-2xl',
    };
  }
  if (spoons === 3) {
    return {
      name: 'BRIDGE',
      wrapper: 'bg-slate-950 text-slate-200 font-serif tracking-wide',
      orb: 'bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] animate-pulse',
      button: 'bg-slate-900/80 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-xl backdrop-blur-sm active:scale-97 transition-all duration-200',
      hud: 'bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-lg',
      input: 'bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30',
      container: 'max-w-6xl mx-auto p-6 border border-slate-800/80 bg-slate-900/40 rounded-2xl',
    };
  }
  return {
    name: 'QUANTUM',
    wrapper: 'bg-black text-emerald-400 font-mono tracking-tight min-h-screen border border-emerald-950/40',
    orb: 'bg-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] animate-pulse rounded-none rotate-45',
    button: 'bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/40 text-emerald-400 rounded-none active:translate-y-px transition-all duration-100',
    hud: 'bg-black border-b border-emerald-900/50 rounded-none',
    input: 'bg-black border border-emerald-900/60 text-emerald-300 rounded-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 font-mono',
    container: 'w-full mx-auto p-4 border border-emerald-950 bg-black/80 font-mono grid gap-4',
  };
}
