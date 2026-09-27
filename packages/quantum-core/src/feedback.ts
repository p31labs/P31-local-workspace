/**
 * @p31ca/quantum-core — quantum computing primitives for the P31 ecosystem.
 *
 * ⚠️ HONEST LABEL
 * All modules in this package are computational models, not established physics.
 * The underlying science (SIC-POVM, Posner molecules, morphogenetic fields) is
 * contested. This code is an architectural metaphor made literal — a sovereign
 * care measurement primitive — not a scientific claim.
 *
 * See QF1_CONTESTED_SCIENCE.md for the full honest-label protocol.
 */

// Core quantum measurement
export { sicPovmFiducial, sicPovmStates, sicPovmProjectors, sicPovmProbabilities, sicPovmFidelity, verifySicPovm } from './sicPovm';
export type { SicPovmState, SicPovmProjector } from './sicPovm';

// K4 graph engine
export { K4Graph, getK4DefaultGraph, K4_ADJACENCY, K4_VERTICES, K4_EDGES } from './k4';
export type { K4Vertex, K4Edge } from './k4';

// Posner molecule
export { posnerAtoms, createPosnerState, updatePosnerCoherence, posnerBondLengths, POSNER_CA_POSITIONS, POSNER_P_POSITIONS, POSNER_O_POSITIONS, POSNER_TOTAL_ATOMS } from './posner';
export type { PosnerAtom, PosnerState } from './posner';

// Morphogenetic field
export { cliffordRotation, morphogeneticLayer, computeMorphogeneticField, morphogeneticFieldValue } from './morphogeneticField';

// DID resolver
export { resolveDIDAsync, parseDid, didKeyToDoc, didWebFetch, didJwkToDoc } from './did';
export type { DIDResolutionResult, DIDDocument } from './did';

// Cosmic / archetypal mapping
export { HOUSE_NEURO_MAP, homoConstellatusProfile, hasTetraConstant, COSMIC_TETRA } from './cosmic';

// Feedback loop (Phase 5 — closes the ring)
export {
  measureShipState,
  measureShipState,
  passportToDensityMatrix,
  vonNeumannEntropy,
  verifyStateEngine,
  initFeedbackState,
  foldOutcome,
  applyFeedback,
  runFeedbackCycle,
  SHIP_MODES,
} from './feedbackLoop';
export type {
  DensityMatrix,
  UserState,
  ShipMode,
  ModeState,
  FeedbackState,
  Outcome,
  FeedbackCycle,
} from './feedbackLoop';
