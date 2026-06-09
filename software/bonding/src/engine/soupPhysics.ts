// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Soup Physics Engine
//
// Handles force simulation for completed molecules in a 2D world.
// ═══════════════════════════════════════════════════════

export interface SoupMolecule {
  id: string;
  formula: string;
  x: number; y: number;
  vx: number; vy: number;
  mass: number;
  polarity: number;
  radius: number;
  personalitySpeed: number; // Not used in this module, but part of the spec
}

export interface SoupConfig {
  width: number; height: number;
  friction: number;
  polarAttraction: number;
  nonpolarAttraction: number;
  polarRepulsion: number;
  wallBounce: number;
  maxSpeed: number;
  reactionDistance: number;
}

export interface SoupState {
  molecules: SoupMolecule[];
  tick: number;
  reactions: Array<{ moleculeA: string; moleculeB: string; reactionId: string; tick: number; }>;
}

const ELECTRONEGATIVITY: Record<string, number> = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, P: 2.19, Na: 0.93, Ca: 1.00, Cl: 3.16, S: 2.58, Fe: 1.83, };
const ATOMIC_MASS: Record<string, number> = { H: 1, C: 12, N: 14, O: 16, P: 31, Na: 23, Ca: 40, Cl: 35.5, S: 32, Fe: 56, };

export function createSoupMolecule(
  id: string, formula: string, elements: Record<string, number>,
  worldWidth: number, worldHeight: number
): SoupMolecule {
  const mass = Object.entries(elements).reduce((sum, [el, count]) => sum + (ATOMIC_MASS[el]! * count), 0);
  return {
    id, formula,
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    mass,
    polarity: calculatePolarity(elements),
    radius: Math.sqrt(Object.values(elements).reduce((s, c) => s + c, 0)) * 5,
    personalitySpeed: 1.0,
  };
}

export function calculatePolarity(elements: Record<string, number>): number {
  const symbols = Object.keys(elements);
  if (symbols.length <= 1) return 0;
  const eNeg = symbols.map(s => ELECTRONEGATIVITY[s] || 2.5);
  const maxDiff = Math.max(...eNeg) - Math.min(...eNeg);
  return Math.min(maxDiff / 2.5, 1.0);
}

export function tickSoup(state: SoupState, config: SoupConfig): SoupState {
    const nextMolecules = state.molecules.map(m => {
        // Apply forces from other molecules
        let fx = 0, fy = 0;
        for (const other of state.molecules) {
            if (m.id === other.id) continue;
            const force = calculateForce(m, other, config);
            fx += force.fx;
            fy += force.fy;
        }

        // Update velocity
        let vx = (m.vx + fx / m.mass) * config.friction;
        let vy = (m.vy + fy / m.mass) * config.friction;

        // Cap speed
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > config.maxSpeed) {
            vx = (vx / speed) * config.maxSpeed;
            vy = (vy / speed) * config.maxSpeed;
        }
        
        // Update position
        let x = m.x + vx;
        let y = m.y + vy;

        // Wall bounce
        if (x < m.radius || x > config.width - m.radius) {
            vx *= -config.wallBounce;
            x = x < m.radius ? m.radius : config.width - m.radius;
        }
        if (y < m.radius || y > config.height - m.radius) {
            vy *= -config.wallBounce;
            y = y < m.radius ? m.radius : config.height - m.radius;
        }

        return { ...m, x, y, vx, vy };
    });

    return { ...state, molecules: nextMolecules, tick: state.tick + 1 };
}

export function calculateForce(a: SoupMolecule, b: SoupMolecule, config: SoupConfig): { fx: number; fy: number } {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distSq = Math.max(100, dx * dx + dy * dy); // Avoid division by zero
    const dist = Math.sqrt(distSq);

    let forceMag = 0;
    if (a.polarity > 0.5 && b.polarity > 0.5) { // Polar-Polar
        forceMag = -config.polarAttraction / distSq;
    } else if (a.polarity <= 0.5 && b.polarity <= 0.5) { // Nonpolar-Nonpolar
        forceMag = -config.nonpolarAttraction / distSq;
    } else { // Polar-Nonpolar
        forceMag = config.polarRepulsion / distSq;
    }

    return { fx: dx / dist * forceMag, fy: dy / dist * forceMag };
}

export function findNearbyReactions(state: SoupState, config: SoupConfig): Array<{ moleculeA: string; moleculeB: string; distance: number }> {
    const candidates = [];
    for (let i = 0; i < state.molecules.length; i++) {
        for (let j = i + 1; j < state.molecules.length; j++) {
            const a = state.molecules[i]!;
            const b = state.molecules[j]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < config.reactionDistance) {
                candidates.push({ moleculeA: a.id, moleculeB: b.id, distance: dist });
            }
        }
    }
    return candidates;
}

export function getDefaultSoupConfig(): SoupConfig {
    return {
        width: 800, height: 600, friction: 0.98,
        polarAttraction: 100, nonpolarAttraction: 20, polarRepulsion: 50,
        wallBounce: 0.5, maxSpeed: 10, reactionDistance: 50
    };
}

export function initializeSoup(
  galleryEntries: Array<{ id: string; formula: string; elements: Record<string, number>; }>,
  width: number, height: number
): SoupState {
    const molecules = galleryEntries.map(g => createSoupMolecule(g.id, g.formula, g.elements, width, height));
    return { molecules, tick: 0, reactions: [] };
}
