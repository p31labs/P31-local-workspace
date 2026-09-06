// ═══════════════════════════════════════════════════════
// @p31/shared — ZUI Types
//
// Zoomable User Interface types for Spaceship Earth.
// Three zoom levels: Macro (Sierpinski Tetrahedron Starfield),
// Meso (Local Zone Orbs), Micro (Creator Context Faces).
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

export enum ZoomLevel {
  MACRO = 0,  // Sierpinski Tetrahedron Starfield
  MESO  = 1,  // Local Zone Orbs
  MICRO = 2,  // Creator Context Faces
}

export interface IVMCoordinate {
  /** Isotropic Vector Matrix — tetrahedral basis vectors (60°) */
  a: number; b: number; c: number; d: number;
}

export interface ZoomTarget {
  level: ZoomLevel;
  nodeId: string | null;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export interface CameraState {
  currentLevel: ZoomLevel;
  previousLevel: ZoomLevel;
  isTransitioning: boolean;
  target: ZoomTarget;
  cameraPosition: [number, number, number];
  cameraLookAt: [number, number, number];
  performanceFactor: number; // 0–1 from PerformanceMonitor
}

export interface MacroNode {
  id: string;
  ivmCoord: IVMCoordinate;
  worldPosition: [number, number, number];
  zoneLabel: string;
  health: number;       // 0–1 for color coding
  childCount: number;
}

export interface MesoOrb {
  id: string;
  parentZoneId: string;
  position: [number, number, number];
  label: string;
  memberCount: number;
  activityPulse: number; // 0–1 glow intensity
  energy: ZoneEnergy;
}

export interface MicroFace {
  id: string;
  parentOrbId: string;
  displayName: string;
  avatarUrl: string;
  karma: number;
  contentPreview: string;
  isCreator: boolean;
}

export type ZoneEnergy =
  | 'kinetic'   // High-energy kinetic
  | 'balanced'  // Communal area
  | 'ordered'   // Quiet focus room
  | 'still';    // Stillness space

export interface ZoneConfig {
  id: string;
  name: string;
  energy: ZoneEnergy;
  rules: string[];
  sovereignResident: string;
  memberCount: number;
  lastActivity: number;
}

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  instanceCount: number;
  memoryUsage: number;
  performanceFactor: number;
}

export interface ZUIConfig {
  maxSierpinskiDepth: number; // 5 for mobile (1,024 nodes), 6 for desktop (4,096)
  adaptiveDPR: boolean;
  useOffscreenCanvas: boolean;
  enableLOD: boolean;
  maxInstances: number;
}