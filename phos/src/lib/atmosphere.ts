export function resolveAtmospherePreset(surface: string): { palette: { primary: string; text: string } } {
  const presets: Record<string, { palette: { primary: string; text: string } }> = {
    NODE_ZERO: { palette: { primary: '#34d399', text: '#fff7ed' } },
    THE_BUFFER: { palette: { primary: '#fb923c', text: '#fff7ed' } },
    GREETING: { palette: { primary: '#34d399', text: '#fffbeb' } },
    ARCADE: { palette: { primary: '#00f5ff', text: '#fff7ed' } },
    COMPASS: { palette: { primary: '#a855f7', text: '#fff7ed' } },
  };
  return presets[surface] || presets.GREETING;
}

export function detectGrayRock(input: string): boolean {
  const modes = ['?mode=', '?mode='];
  const lower = input.toLowerCase();
  return modes.some((m) => lower.includes(m + 'crisis') || lower.includes(m + 'urgent'));
}
