// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Molecule Personalities
//
// When a molecule completes, it gets a "personality" — a behavior
// type that drives post-completion animation. This is data + logic,
// not rendering. CC handles the visual layer.
// ═══════════════════════════════════════════════════════

export type PersonalityType =
  | 'mediator'    // polar, social — gently orbits
  | 'rock'        // ionic, stable — vibrates in place
  | 'loner'       // nonpolar organic — drifts, fast
  | 'fuel'        // organic + oxygen — warm pulse
  | 'messenger'   // small gas — fast, everywhere
  | 'builder'     // calcium compound — slow, structural
  | 'oracle';     // Posner molecule — everything orbits it

export interface MoleculePersonality {
  type: PersonalityType;
  name: string;           // e.g., "The Mediator"
  description: string;    // e.g., "Water goes where it's needed."
  animationHint: {
    speed: number;        // 0-1 scale (0=still, 1=fast)
    drift: boolean;       // does it move?
    pulse: boolean;       // does it glow/pulse?
    vibrate: boolean;     // does it shake in place?
    orbit: boolean;       // does it circle other molecules?
    scale: number;        // relative size modifier (0.8-1.5)
  };
}

const PERSONALITIES: Record<PersonalityType, Omit<MoleculePersonality, 'type'>> = {
  oracle: {
    name: 'The Oracle',
    description: 'This molecule might store quantum information.',
    animationHint: {
      speed: 0.05, drift: false, pulse: true, vibrate: false, orbit: false, scale: 1.5
    }
  },
  builder: {
    name: 'The Builder',
    description: 'Your skeleton is made of this.',
    animationHint: {
      speed: 0.1, drift: true, pulse: false, vibrate: false, orbit: false, scale: 1.3
    }
  },
  rock: {
    name: 'The Rock',
    description: 'Stable. Enduring. Unshakable.',
    animationHint: {
      speed: 0.05, drift: false, pulse: false, vibrate: true, orbit: false, scale: 1.1
    }
  },
  fuel: {
    name: 'The Fuel',
    description: 'Every cell is hungry for this.',
    animationHint: {
      speed: 0.3, drift: true, pulse: true, vibrate: false, orbit: false, scale: 1.0
    }
  },
  mediator: {
    name: 'The Mediator',
    description: 'Goes where it\'s needed.',
    animationHint: {
      speed: 0.4, drift: true, pulse: false, vibrate: false, orbit: true, scale: 1.0
    }
  },
  messenger: {
    name: 'The Messenger',
    description: 'Fast. Everywhere. Can\'t be caught.',
    animationHint: {
      speed: 0.8, drift: true, pulse: false, vibrate: false, orbit: false, scale: 0.8
    }
  },
  loner: {
    name: 'The Loner',
    description: 'Drifts away from the crowd.',
    animationHint: {
      speed: 0.5, drift: true, pulse: false, vibrate: false, orbit: false, scale: 0.9
    }
  }
};

export function getPersonality(
  formula: string,
  elements: Record<string, number>
): MoleculePersonality {
  const elementSet = new Set(Object.keys(elements));
  const atomCount = Object.values(elements).reduce((a, b) => a + b, 0);

  let type: PersonalityType;

  if (formula === 'Ca9O24P6') {
    type = 'oracle';
  } else if (elementSet.has('Ca') && (elementSet.has('P') || elementSet.has('O'))) {
    type = 'builder';
  } else if ((elementSet.has('Na') && elementSet.has('Cl')) || (elementSet.has('Fe') && elementSet.has('S'))) {
    type = 'rock';
  } else if (elementSet.has('C') && elementSet.has('O') && elementSet.has('H')) {
    type = 'fuel';
  } else if (elementSet.has('O') && elementSet.has('H') && !elementSet.has('C')) {
    type = 'mediator';
  } else if (atomCount <= 3) {
    type = 'messenger';
  } else {
    type = 'loner';
  }

  return { type, ...PERSONALITIES[type] };
}
