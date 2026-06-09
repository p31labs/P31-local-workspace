// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Constellation Data Engine
//
// Computes positions, brightness, and clustering for the star field.
// ═══════════════════════════════════════════════════════

export interface Star {
  id: string;
  formula: string;
  name: string;
  x: number; y: number;
  brightness: number;
  size: number;
  color: string;
  createdAt: number;
  isDiscovery: boolean;
}

export interface ConstellationLine {
  from: string;
  to: string;
  strength: number;
}

const ELEMENT_COLORS: Record<string, string> = { H: '#FFFFFF', O: '#FF0000', C: '#808080', N: '#0000FF', P: '#FFA500', Na: '#9370DB', Ca: '#E6E6FA', Cl: '#00FF00', S: '#FFFF00', Fe: '#A52A2A' };

export function generateConstellation(
  gallery: Array<{ id: string; formula: string; name: string; love: number; atoms: number; completedAt: string; isDiscovery: boolean; elements: Record<string, number>; }>
): { stars: Star[]; lines: ConstellationLine[] } {
  if (gallery.length === 0) return { stars: [], lines: [] };
  
  const sortedGallery = [...gallery].sort((a,b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const firstCreated = new Date(sortedGallery[0]!.completedAt).getTime();
  const lastCreated = new Date(sortedGallery[sortedGallery.length - 1]!.completedAt).getTime();

  const stars = sortedGallery.map((entry, i) => {
    const {x, y} = positionStar(i, gallery.length, new Date(entry.completedAt).getTime(), firstCreated, lastCreated);
    return {
      id: entry.id,
      formula: entry.formula,
      name: entry.name,
      x, y,
      brightness: calculateBrightness(entry.love),
      size: Math.sqrt(entry.atoms) * 2,
      color: getDominantColor(entry.elements),
      createdAt: new Date(entry.completedAt).getTime(),
      isDiscovery: entry.isDiscovery,
    };
  });
  
  const lines = findConstellationLines(stars, gallery);
  return { stars, lines };
}

export function positionStar(
  index: number, total: number, _createdAt: number, _firstCreated: number, _lastCreated: number
): { x: number; y: number } {
  const angle = index * (Math.PI * 2) / total * (total / 1.618); // Golden angle for spiral
  const radius = Math.sqrt(index / total); // Spread them out
  return {
    x: 0.5 + Math.cos(angle) * radius * 0.45,
    y: 0.5 + Math.sin(angle) * radius * 0.45,
  };
}

export function calculateBrightness(love: number): number {
  return Math.max(0.1, Math.min(1.0, love / 200));
}

export function getDominantColor(elements: Record<string, number>): string {
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
  return ELEMENT_COLORS[dominant?.[0] ?? 'C'] ?? '#FFFFFF';
}

export function findConstellationLines(
  stars: Star[],
  gallery: Array<{ id: string; elements: Record<string, number> }>
): ConstellationLine[] {
    const lines: ConstellationLine[] = [];
    const elementMap = new Map(gallery.map(g => [g.id, new Set(Object.keys(g.elements))]));

    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const starA = stars[i]!;
            const starB = stars[j]!;
            const elementsA = elementMap.get(starA.id) ?? new Set();
            const elementsB = elementMap.get(starB.id) ?? new Set();
            
            const intersection = new Set(Array.from(elementsA).filter(x => elementsB.has(x)));
            if (intersection.size >= 2) {
                lines.push({
                    from: starA.id,
                    to: starB.id,
                    strength: Math.min(1.0, intersection.size / 4), // Normalize strength
                });
            }
        }
    }
    return lines;
}
