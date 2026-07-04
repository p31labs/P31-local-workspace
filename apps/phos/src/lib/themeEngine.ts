export interface ThemeShape {
  name: string;
  wrapper: string;
  orb: string;
  button: string;
  hud: string;
  input: string;
  container: string;
  [key: string]: string;
}

export function getThemeName(spoons: number): string {
  if (spoons === 0) return 'crisis';
  if (spoons <= 2) return 'sanctuary';
  if (spoons === 3) return 'bridge';
  return 'quantum';
}

export function getBiologicalTheme(spoons: number, grayRock: boolean): ThemeShape {
  if (grayRock || spoons === 0) {
    return {
      name: 'CRISIS',
      wrapper: 'bg-phos-bg text-phos-mute font-mono tracking-tight select-none',
      orb: 'bg-phos-card border-phos-border shadow-none animate-none scale-90',
      button: 'bg-phos-card border-phos-border text-phos-mute rounded-sm transition-none',
      hud: 'bg-phos-bg border-phos-border rounded-none',
      input: 'bg-phos-card border-phos-border text-phos-mute rounded-none pointer-events-none',
      container: 'max-w-xl mx-auto p-4 border-phos-border bg-phos-bg',
    };
  }
  if (spoons <= 2) {
    return {
      name: 'SANCTUARY',
      wrapper: 'bg-phos-bg text-phos-text font-sans tracking-normal',
      orb: 'bg-phos-primary shadow-[0_0_40px_var(--p31-accent-primary-dim)] animate-biomimetic-breath',
      button: 'bg-phos-card hover:bg-phos-card border-phos-border text-phos-text rounded-full shadow-md backdrop-blur-md active:scale-98 transition-all duration-300',
      hud: 'bg-phos-card backdrop-blur-xl border-phos-border rounded-3xl shadow-xl',
      input: 'bg-phos-card border-phos-border text-phos-text rounded-full backdrop-blur-md focus:border-phos-primary focus:ring-1 focus:ring-phos-primary/30 transition-all duration-300',
      container: 'max-w-4xl mx-auto p-8 rounded-3xl bg-phos-card border-phos-border backdrop-blur-md shadow-2xl',
    };
  }
  if (spoons === 3) {
    return {
      name: 'BRIDGE',
      wrapper: 'bg-phos-bg text-phos-text font-serif tracking-wide',
      orb: 'bg-phos-primary shadow-[0_0_30px_var(--p31-accent-primary-dim)] animate-pulse',
      button: 'bg-phos-card hover:bg-phos-card border-phos-border text-phos-text rounded-xl backdrop-blur-sm active:scale-97 transition-all duration-200',
      hud: 'bg-phos-card backdrop-blur-lg border-phos-border rounded-2xl shadow-lg',
      input: 'bg-phos-card border-phos-border text-phos-text rounded-xl focus:border-phos-primary focus:ring-1 focus:ring-phos-primary/30',
      container: 'max-w-6xl mx-auto p-6 border-phos-border bg-phos-card rounded-2xl',
    };
  }
    return {
      name: 'QUANTUM',
      wrapper: 'bg-phos-bg text-phos-text font-sans tracking-normal min-h-screen',
      orb: 'bg-phos-primary shadow-[0_0_50px_var(--p31-accent-primary-dim)] animate-pulse',
      button: 'bg-phos-card hover:bg-phos-card border-phos-border text-phos-text rounded-2xl backdrop-blur-md active:scale-98 transition-all duration-300',
      hud: 'bg-phos-card backdrop-blur-xl border-phos-border rounded-2xl shadow-xl',
      input: 'bg-phos-card border-phos-border text-phos-text rounded-2xl backdrop-blur-md focus:border-phos-primary focus:ring-1 focus:ring-phos-primary/30 font-sans transition-all duration-300',
      container: 'max-w-6xl mx-auto p-6 border-phos-border bg-phos-bg rounded-2xl backdrop-blur-md',
    };
}
