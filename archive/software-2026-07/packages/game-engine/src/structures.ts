/**
 * @module game-engine/structures
 * @description Structure management — create, place pieces, validate.
 */

import type {
  Structure,
  PlacedPiece,
  PrimitiveType,
  Vec3,
} from "./types.js";
import { analyzeStructure, vec3, findSnaps } from "./geometry.js";

let _structureCounter = 0;
let _pieceCounter = 0;

export function createStructure(
  name: string,
  createdBy: string,
  color: string = "#4ade80"
): Structure {
  return {
    id: `structure_${++_structureCounter}`,
    name,
    createdBy,
    createdAt: new Date().toISOString(),
    pieces: [],
    rigidity: analyzeStructure([]),
    color,
  };
}

export function createGenesisDome(
  createdBy: string,
  domeName: string,
  color: string
): Structure {
  const piece: PlacedPiece = {
    id: `piece_${++_pieceCounter}`,
    type: "tetrahedron",
    position: vec3(0, 0, 0),
    rotation: vec3(0, 0, 0),
    scale: 1.0,
    connectedTo: [],
    color,
    placedAt: new Date().toISOString(),
  };

  const pieces = [piece];
  return {
    id: `dome_${createdBy.slice(0, 8)}`,
    name: domeName,
    createdBy,
    createdAt: new Date().toISOString(),
    pieces,
    rigidity: analyzeStructure(pieces),
    color,
  };
}

export function placePiece(
  structure: Structure,
  type: PrimitiveType,
  position: Vec3,
  rotation: Vec3 = vec3(0, 0, 0),
  scale: number = 1.0,
  color?: string,
  autoConnect: boolean = true
): { structure: Structure; piece: PlacedPiece; snaps: number } {
  const newPiece: PlacedPiece = {
    id: `piece_${++_pieceCounter}`,
    type,
    position,
    rotation,
    scale,
    connectedTo: [],
    color: color || structure.color,
    placedAt: new Date().toISOString(),
  };

  let connectedTo: string[] = [];
  let snaps = 0;

  if (autoConnect) {
    const snapResults = findSnaps(newPiece, structure.pieces);
    connectedTo = [...new Set(snapResults.map(s => s.existingPieceId))];
    snaps = connectedTo.length;
  }

  const placedPiece: PlacedPiece = { ...newPiece, connectedTo };

  const updatedPieces = structure.pieces.map(p => {
    if (connectedTo.includes(p.id)) {
      return { ...p, connectedTo: [...p.connectedTo, placedPiece.id] };
    }
    return p;
  });

  const allPieces = [...updatedPieces, placedPiece];
  const rigidity = analyzeStructure(allPieces);

  return {
    structure: { ...structure, pieces: allPieces, rigidity },
    piece: placedPiece,
    snaps,
  };
}

export function undoLastPiece(
  structure: Structure
): { structure: Structure; removed: PlacedPiece } | null {
  if (structure.pieces.length === 0) return null;

  const removed = structure.pieces[structure.pieces.length - 1];
  const remainingPieces = structure.pieces.slice(0, -1).map(p => ({
    ...p,
    connectedTo: p.connectedTo.filter(id => id !== removed.id),
  }));

  return {
    structure: {
      ...structure,
      pieces: remainingPieces,
      rigidity: analyzeStructure(remainingPieces),
    },
    removed,
  };
}

export function connectPieces(
  structure: Structure,
  pieceIdA: string,
  pieceIdB: string
): Structure {
  const updated = structure.pieces.map(p => {
    if (p.id === pieceIdA && !p.connectedTo.includes(pieceIdB)) {
      return { ...p, connectedTo: [...p.connectedTo, pieceIdB] };
    }
    if (p.id === pieceIdB && !p.connectedTo.includes(pieceIdA)) {
      return { ...p, connectedTo: [...p.connectedTo, pieceIdA] };
    }
    return p;
  });

  return {
    ...structure,
    pieces: updated,
    rigidity: analyzeStructure(updated),
  };
}

export function pieceCountByType(structure: Structure): Record<PrimitiveType, number> {
  const counts: Record<PrimitiveType, number> = {
    tetrahedron: 0, octahedron: 0, icosahedron: 0, strut: 0, hub: 0,
  };
  for (const piece of structure.pieces) {
    counts[piece.type]++;
  }
  return counts;
}

export function uniquePrimitiveTypes(structure: Structure): number {
  return new Set(structure.pieces.map(p => p.type)).size;
}
