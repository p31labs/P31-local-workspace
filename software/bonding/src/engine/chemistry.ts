// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Chemistry engine: VSEPR bond site positioning,
// stability calculation, formula generation
//
// VSEPR = Valence Shell Electron Pair Repulsion
// This engine computes where ghost bond sites appear
// around each atom based on its molecular geometry.
// ═══════════════════════════════════════════════════════

import { Vector3, Quaternion, MathUtils } from 'three';
import type { PlacedAtom, ElementSymbol, Bond } from '../types';

// ── Utility functions ──

export function getAvailableBondSites(atom: PlacedAtom): number {
  return atom.bondSites - atom.bondedTo.length;
}

export function canBond(atom: PlacedAtom): boolean {
  return getAvailableBondSites(atom) > 0;
}

export function calculateStability(atoms: PlacedAtom[]): number {
  if (atoms.length === 0) return 0;
  const totalValence = atoms.reduce((sum, a) => sum + a.bondSites, 0);
  const filledBonds = atoms.reduce((sum, a) => sum + a.bondedTo.length, 0);
  return filledBonds / totalValence;
}

export function isMoleculeComplete(atoms: PlacedAtom[]): boolean {
  if (atoms.length === 0) return false;
  return atoms.every((atom) => getAvailableBondSites(atom) === 0);
}

/**
 * Returns true if atoms + bonds form a K4 complete graph (regular tetrahedron).
 * Enforces Maxwell's counting condition for isostatic rigidity: E = 3V − 6.
 * For V = 4: exactly 6 unique undirected bonds required (3·4 − 6 = 6).
 */
export function isK4(atoms: PlacedAtom[], bonds: Bond[]): boolean {
  if (atoms.length !== 4) return false;
  const edgeSet = new Set<string>();
  for (const bond of bonds) {
    const key = [bond.from, bond.to].sort((a, b) => a - b).join('-');
    edgeSet.add(key);
  }
  return edgeSet.size === 6;
}

/**
 * Generate molecular formula string with Unicode subscripts.
 * Follows Hill system ordering: C first, H second, then alphabetical.
 */
export function generateFormula(atoms: PlacedAtom[]): string {
  if (atoms.length === 0) return '';

  const counts: Record<string, number> = {};
  for (const a of atoms) {
    counts[a.element] = (counts[a.element] ?? 0) + 1;
  }

  // Hill system: C first, H second, rest alphabetical
  const order = ['C', 'H', 'N', 'O', 'P', 'S', 'Na', 'Ca'];
  const elements = Object.keys(counts).sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const sub = (n: number): string => {
    const subs = [
      '\u2080', '\u2081', '\u2082', '\u2083', '\u2084',
      '\u2085', '\u2086', '\u2087', '\u2088', '\u2089',
    ];
    return n > 1
      ? n.toString().split('').map((c) => subs[parseInt(c)] ?? c).join('')
      : '';
  };

  return elements.map((el) => `${el}${sub(counts[el] ?? 0)}`).join('');
}

/**
 * Count unique elements in a molecule.
 */
export function countUniqueElements(atoms: PlacedAtom[]): number {
  const seen = new Set<ElementSymbol>();
  for (const a of atoms) {
    seen.add(a.element);
  }
  return seen.size;
}

/**
 * Short display names for known molecules, keyed by Unicode formula.
 * Used by the checkpoint system to show "= Water!" in the UI.
 */
export const MOLECULE_NAMES: Record<string, string> = {
  'H\u2082': 'Hydrogen Gas',
  'O\u2082': 'Oxygen Gas',
  'H\u2082O': 'Water',
  'H\u2082O\u2082': 'Hydrogen Peroxide',
  'CO\u2082': 'Carbon Dioxide',
  'CH\u2084': 'Methane',
  'C\u2082H\u2086': 'Ethane',
  'C\u2082H\u2084': 'Ethylene',
  'C\u2082H\u2082': 'Acetylene',
  'C\u2083H\u2088': 'Propane',
  'C\u2086H\u2081\u2082O\u2086': 'Glucose',
  'N\u2082': 'Nitrogen Gas',
  'H\u2083N': 'Ammonia',
  'NaCl': 'Table Salt',
  'HCl': 'Hydrochloric Acid',
  'HONa': 'Lye',
  'OCa': 'Quicklime',
  'H\u2082O\u2082Ca': 'Slaked Lime',
  'CO\u2083Ca': 'Limestone',
  'ONa\u2082': 'Sodium Oxide',
  'O\u2083P\u2082': 'Phosphorus Trioxide',
  'O\u2085P\u2082': 'Phosphorus Pentoxide',
  'O\u2088P\u2082Ca\u2083': 'Calcium Phosphate',
  'O\u2082\u2084P\u2086Ca\u2089': 'The Posner',
  'CH\u2084O': 'Methanol',
  'C\u2082H\u2086O': 'Ethanol',
  'H\u2082S': 'Hydrogen Sulfide',
  'SFe': 'Iron Sulfide',
  'O\u2083Fe\u2082': 'Iron Oxide',
  'OFe': 'W\u00FCstite',
  'O\u2082S': 'Sulfur Dioxide',
  'HNO\u2083': 'Nitric Acid',
  // Gases
  'CO': 'Carbon Monoxide',
  'NO': 'Nitric Oxide',
  'NO\u2082': 'Nitrogen Dioxide',
  'N\u2082O': 'Laughing Gas',
  'H\u2083P': 'Phosphine',
  'O\u2083S': 'Sulfur Trioxide',
  'CS\u2082': 'Carbon Disulfide',
  'CHN': 'Hydrogen Cyanide',
  // Acids
  'H\u2082O\u2084S': 'Sulfuric Acid',
  'H\u2083O\u2084P': 'Phosphoric Acid',
  'CH\u2082O\u2083': 'Carbonic Acid',
  'CH\u2082O\u2082': 'Formic Acid',
  'C\u2082H\u2084O\u2082': 'Acetic Acid',
  'H\u2082O\u2083S': 'Sulfurous Acid',
  'HNO\u2082': 'Nitrous Acid',
  // Salts / bases
  'CaCl\u2082': 'Calcium Chloride',
  'CO\u2083Na\u2082': 'Washing Soda',
  'CHO\u2083Na': 'Baking Soda',
  'SNa\u2082': 'Sodium Sulfide',
  'ONaCl': 'Bleach',
  'O\u2084SNa\u2082': 'Sodium Sulfate',
  'HNa': 'Sodium Hydride',
  'H\u2082Ca': 'Calcium Hydride',
  // Organics
  'CH\u2082O': 'Formaldehyde',
  'CH\u2084N\u2082O': 'Urea',
  'C\u2086H\u2086': 'Benzene',
  'C\u2086H\u2086O': 'Phenol',
  // Metal compounds
  'O\u2084SFe': 'Iron(II) Sulfate',
  'O\u2084SCa': 'Gypsum',
  'O\u2084Fe\u2083': 'Magnetite',
  'Cl\u2082Fe': 'Iron(II) Chloride',
  'Cl\u2083Fe': 'Iron(III) Chloride',
  'HO\u2084PCa': 'Dicalcium Phosphate',
  'CCl\u2084': 'Carbon Tetrachloride',
  'P\u2084': 'White Phosphorus',
};

/**
 * Hill system → conventional display mapping.
 * Internal keys stay Hill-canonical; UI calls displayFormula() at render time.
 */
const DISPLAY_FORMULAS: Record<string, string> = {
  'OCa': 'CaO',
  'HONa': 'NaOH',
  'H\u2082O\u2082Ca': 'Ca(OH)\u2082',
  'CO\u2083Ca': 'CaCO\u2083',
  'ONa\u2082': 'Na\u2082O',
  'O\u2083P\u2082': 'P\u2082O\u2083',
  'O\u2085P\u2082': 'P\u2082O\u2085',
  'O\u2088P\u2082Ca\u2083': 'Ca\u2083(PO\u2084)\u2082',
  'O\u2082\u2084P\u2086Ca\u2089': 'Ca\u2089(PO\u2084)\u2086',
  'CH\u2084O': 'CH\u2083OH',
  'C\u2082H\u2086O': 'C\u2082H\u2085OH',
  'H\u2083N': 'NH\u2083',
  'SFe': 'FeS',
  'O\u2083Fe\u2082': 'Fe\u2082O\u2083',
  'OFe': 'FeO',
  'O\u2082S': 'SO\u2082',
  // Acids
  'H\u2082O\u2084S': 'H\u2082SO\u2084',
  'H\u2083O\u2084P': 'H\u2083PO\u2084',
  'CH\u2082O\u2083': 'H\u2082CO\u2083',
  'H\u2082O\u2083S': 'H\u2082SO\u2083',
  'HO\u2084PCa': 'CaHPO\u2084',
  // Salts / bases
  'CO\u2083Na\u2082': 'Na\u2082CO\u2083',
  'CHO\u2083Na': 'NaHCO\u2083',
  'SNa\u2082': 'Na\u2082S',
  'ONaCl': 'NaClO',
  'O\u2084SNa\u2082': 'Na\u2082SO\u2084',
  // Metal compounds
  'O\u2084SFe': 'FeSO\u2084',
  'O\u2084SCa': 'CaSO\u2084',
  'O\u2084Fe\u2083': 'Fe\u2083O\u2084',
  'Cl\u2082Fe': 'FeCl\u2082',
  'Cl\u2083Fe': 'FeCl\u2083',
  'HNa': 'NaH',
  'H\u2082Ca': 'CaH\u2082',
  // Gases / small molecules
  'H\u2083P': 'PH\u2083',
  'O\u2083S': 'SO\u2083',
  'CHN': 'HCN',
  // Organics
  'C\u2086H\u2086O': 'C\u2086H\u2085OH',
  'CH\u2084N\u2082O': 'CO(NH\u2082)\u2082',
  // Advanced phosphorus
  'O\u2081\u2080P\u2084': 'P\u2084O\u2081\u2080',
};

export function displayFormula(hill: string): string {
  return DISPLAY_FORMULAS[hill] ?? hill;
}

// ── VSEPR Bond Site Engine ──

// Pre-computed ideal direction vectors for each molecular geometry.
// These define WHERE ghost bond sites appear relative to the atom center.
const GEOMETRY_VECTORS: Record<string, Vector3[]> = {
  // Tetrahedral: alternating cube corners, normalized — 109.47° between bonds
  tetrahedral: [
    new Vector3(1, 1, 1).normalize(),
    new Vector3(1, -1, -1).normalize(),
    new Vector3(-1, 1, -1).normalize(),
    new Vector3(-1, -1, 1).normalize(),
  ],
  // Trigonal planar: 120° in XY plane
  trigonal_planar: [
    new Vector3(0, 1, 0),
    new Vector3(0.866, -0.5, 0),
    new Vector3(-0.866, -0.5, 0),
  ],
  // Bent: 104.5° bond angle (lone pairs compress from tetrahedral 109.5°)
  bent: [
    new Vector3(0, 0.612, 0.791).normalize(),
    new Vector3(0, 0.612, -0.791).normalize(),
  ],
  // Linear: 180°
  linear: [
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
  ],
  // Terminal: single bond direction
  terminal: [
    new Vector3(0, 1, 0),
  ],
};

/**
 * Map element to MOLECULAR geometry (not electron geometry).
 * Lone pair compression is baked into the vector sets above.
 */
function getMolecularGeometry(element: ElementSymbol): string {
  switch (element) {
    case 'O':  return 'bent';            // 2 lone pairs → 104.5°
    case 'Ca': return 'linear';          // ionic coordination → 180°
    case 'C':  return 'tetrahedral';     // sp3 → 109.47°
    case 'N':  return 'trigonal_planar'; // sp3 but simplified → 120°
    case 'P':  return 'trigonal_planar'; // sp2 simplified → 120°
    case 'H':  return 'terminal';
    case 'Na': return 'terminal';
    default:   return 'tetrahedral';
  }
}

/**
 * Find quaternion that best aligns ideal VSEPR vectors
 * with existing bond directions. Uses Wahba's problem
 * approach: align first vector exactly, then twist to
 * minimize angular error on second.
 */
function findBestRotation(
  idealVectors: Vector3[],
  existingBonds: Vector3[],
): Quaternion {
  if (existingBonds.length === 0) return new Quaternion();

  // Single bond: rotate ideal[0] to match
  if (existingBonds.length === 1) {
    const q = new Quaternion();
    q.setFromUnitVectors(
      idealVectors[0]!.clone().normalize(),
      existingBonds[0]!.clone().normalize(),
    );
    return q;
  }

  // Two+ bonds: align ideal[0] to existing[0], then twist
  const q1 = new Quaternion();
  q1.setFromUnitVectors(
    idealVectors[0]!.clone().normalize(),
    existingBonds[0]!.clone().normalize(),
  );

  const rotatedIdeal1 = idealVectors[1]!.clone().applyQuaternion(q1);
  const target1 = existingBonds[1]!.clone().normalize();
  const axis = existingBonds[0]!.clone().normalize();

  // Project both onto plane perpendicular to the first bond axis
  const proj1 = rotatedIdeal1.clone().sub(
    axis.clone().multiplyScalar(rotatedIdeal1.dot(axis)),
  );
  const projTarget = target1.clone().sub(
    axis.clone().multiplyScalar(target1.dot(axis)),
  );

  // Degenerate case — vectors parallel to axis
  if (proj1.length() < 0.001 || projTarget.length() < 0.001) {
    return q1;
  }

  proj1.normalize();
  projTarget.normalize();

  const angle = Math.acos(MathUtils.clamp(proj1.dot(projTarget), -1, 1));
  const cross = new Vector3().crossVectors(proj1, projTarget);
  const sign = Math.sign(cross.dot(axis)) || 1;

  const q2 = new Quaternion().setFromAxisAngle(axis, angle * sign);
  return q2.multiply(q1);
}

const BOND_LENGTH = 0.8;

// Pre-allocated Vector3s for hot-path reuse (zero GC pressure during drag)
const _center = new Vector3();
const _otherPos = new Vector3();
const _away = new Vector3();
const _bondDir = new Vector3();

/**
 * Compute world-space positions for all available bond sites
 * on a given atom. This is the core of the VSEPR ghost system:
 * it returns positions where a new atom CAN snap to.
 */
export function getAvailableBondSitePositions(
  atom: PlacedAtom,
  allAtoms: PlacedAtom[],
): Vector3[] {
  const available = getAvailableBondSites(atom);
  if (available <= 0) return [];

  _center.set(atom.position.x, atom.position.y, atom.position.z);
  const geometry = getMolecularGeometry(atom.element);
  const geoVectors = GEOMETRY_VECTORS[geometry];
  if (!geoVectors) return [];
  const idealVectors = geoVectors.map((v) => v.clone());

  // No bonds yet — return all ideal positions centered on atom
  if (atom.bondedTo.length === 0) {
    return idealVectors.map((v) => v.multiplyScalar(BOND_LENGTH).add(_center));
  }

  // Compute existing bond directions (unit vectors from center to bonded atoms)
  const bondDirs = atom.bondedTo.map((id) => {
    const bonded = allAtoms.find((a) => a.id === id);
    if (!bonded) return new Vector3(0, 1, 0);
    _bondDir.set(
      bonded.position.x - _center.x,
      bonded.position.y - _center.y,
      bonded.position.z - _center.z,
    ).normalize();
    // Must clone here — bondDirs array needs distinct instances for findBestRotation
    return _bondDir.clone();
  });

  // Rotate ideal vectors to align with existing bond directions
  const rotation = findBestRotation(idealVectors, bondDirs);

  // Apply rotation, filter out directions matching existing bonds, return world positions
  const sites = idealVectors
    .map((v) => v.clone().applyQuaternion(rotation))
    .filter((v) => !bondDirs.some((existing) => v.dot(existing) > 0.95)) // ~18° tolerance
    .map((v) => v.multiplyScalar(BOND_LENGTH).add(_center));

  // Nudge sites that overlap with existing atoms (reuse _otherPos + _away)
  return sites.map((site) => {
    for (const other of allAtoms) {
      if (other.id === atom.id) continue;
      _otherPos.set(other.position.x, other.position.y, other.position.z);
      if (site.distanceTo(_otherPos) < 0.5) {
        _away.copy(site).sub(_center).normalize();
        site.addScaledVector(_away, 0.3);
      }
    }
    return site;
  });
}
