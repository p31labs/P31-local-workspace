import { describe, it, expect } from "vitest";
import {
  SEED_CHALLENGES,
  getChallenge,
  canAttempt,
  isChallengeComplete,
  availableChallenges,
  nextChallenge,
  freshChallenge,
} from "../src/challenges.js";
import {
  createStructure,
  createGenesisDome,
  placePiece,
  undoLastPiece,
  connectPieces,
  pieceCountByType,
  uniquePrimitiveTypes,
} from "../src/structures.js";
import { createPlayer } from "../src/player.js";
import { vec3 } from "../src/geometry.js";

describe("SEED_CHALLENGES", () => {
  it("has 7 challenges", () => {
    expect(SEED_CHALLENGES).toHaveLength(7);
  });

  it("genesis_resonance has no prerequisites", () => {
    const c = getChallenge("genesis_resonance");
    expect(c?.prerequisites).toEqual([]);
  });

  it("geodesic_dome requires sequoia tier", () => {
    const c = getChallenge("geodesic_dome");
    expect(c?.tier).toBe("sequoia");
  });
});

describe("getChallenge", () => {
  it("returns challenge by id", () => {
    expect(getChallenge("minimum_system")?.title).toBe("The Minimum System");
  });
  it("returns undefined for unknown id", () => {
    expect(getChallenge("unknown")).toBeUndefined();
  });
});

describe("canAttempt", () => {
  it("seedling can attempt genesis_resonance", () => {
    const player = createPlayer("n", "Dome");
    const c = getChallenge("genesis_resonance")!;
    expect(canAttempt(c, player)).toBe(true);
  });

  it("seedling cannot attempt geodesic_dome (tier)", () => {
    const player = createPlayer("n", "Dome");
    const c = getChallenge("geodesic_dome")!;
    expect(canAttempt(c, player)).toBe(false);
  });

  it("cannot attempt already completed", () => {
    const player = createPlayer("n", "Dome");
    const p2 = { ...player, completedChallenges: ["genesis_resonance"] };
    const c = getChallenge("genesis_resonance")!;
    expect(canAttempt(c, p2)).toBe(false);
  });

  it("cannot attempt without prerequisite", () => {
    const player = createPlayer("n", "Dome");
    const c = getChallenge("minimum_system")!;
    expect(canAttempt(c, player)).toBe(false); // needs genesis_resonance first
    const c2 = getChallenge("double_bond")!;
    expect(canAttempt(c2, player)).toBe(false); // needs minimum_system
  });
});

describe("isChallengeComplete", () => {
  it("all objectives met returns true", () => {
    const c = freshChallenge("minimum_system")!;
    c.objectives[0].current = 1;
    c.objectives[1].current = 1;
    expect(isChallengeComplete(c)).toBe(true);
  });

  it("one objective not met returns false", () => {
    const c = freshChallenge("minimum_system")!;
    c.objectives[0].current = 1;
    c.objectives[1].current = 0;
    expect(isChallengeComplete(c)).toBe(false);
  });
});

describe("availableChallenges", () => {
  it("new player gets genesis_resonance first", () => {
    const player = createPlayer("n", "Dome");
    const avail = availableChallenges(player);
    expect(avail.length).toBeGreaterThanOrEqual(1);
    expect(avail[0]?.id).toBe("genesis_resonance");
  });
});

describe("nextChallenge", () => {
  it("returns first available", () => {
    const player = createPlayer("n", "Dome");
    expect(nextChallenge(player)?.id).toBe("genesis_resonance");
  });
});

describe("freshChallenge", () => {
  it("resets objective current to 0", () => {
    const c = getChallenge("minimum_system")!;
    c.objectives[0].current = 99;
    const fresh = freshChallenge("minimum_system")!;
    expect(fresh.objectives[0].current).toBe(0);
  });
});

describe("createStructure", () => {
  it("creates empty structure", () => {
    const s = createStructure("Test", "node-1");
    expect(s.name).toBe("Test");
    expect(s.createdBy).toBe("node-1");
    expect(s.pieces).toHaveLength(0);
    expect(s.rigidity.isRigid).toBe(false);
  });
});

describe("createGenesisDome", () => {
  it("creates single tetrahedron dome", () => {
    const s = createGenesisDome("node-1", "Crystal", "#4ade80");
    expect(s.pieces).toHaveLength(1);
    expect(s.pieces[0]?.type).toBe("tetrahedron");
    expect(s.rigidity.vertices).toBe(4);
    expect(s.rigidity.edges).toBe(6);
    expect(s.rigidity.isRigid).toBe(true);
  });
});

describe("placePiece", () => {
  it("adds piece to structure", () => {
    const s = createStructure("S", "node-1");
    const { structure, piece } = placePiece(s, "tetrahedron", vec3(1, 0, 0));
    expect(structure.pieces).toHaveLength(1);
    expect(piece.type).toBe("tetrahedron");
    expect(piece.position).toEqual(vec3(1, 0, 0));
  });
});

describe("undoLastPiece", () => {
  it("removes last piece", () => {
    const s = createStructure("S", "node-1");
    const { structure: s2 } = placePiece(s, "tetrahedron", vec3(0, 0, 0));
    const result = undoLastPiece(s2);
    expect(result).not.toBeNull();
    expect(result!.structure.pieces).toHaveLength(0);
  });

  it("returns null for empty structure", () => {
    const s = createStructure("S", "node-1");
    expect(undoLastPiece(s)).toBeNull();
  });
});

describe("connectPieces", () => {
  it("adds bidirectional connection", () => {
    const s = createStructure("S", "node-1");
    const { structure: s2 } = placePiece(s, "tetrahedron", vec3(0, 0, 0));
    const { structure: s3, piece: p2 } = placePiece(s2, "tetrahedron", vec3(2, 0, 0));
    const s4 = connectPieces(s3, s3.pieces[0].id, p2.id);
    expect(s4.pieces[0].connectedTo).toContain(p2.id);
    expect(s4.pieces[1].connectedTo).toContain(s4.pieces[0].id);
  });
});

describe("pieceCountByType", () => {
  it("counts by type", () => {
    const s = createStructure("S", "node-1");
    const { structure: s2 } = placePiece(s, "tetrahedron", vec3(0, 0, 0));
    const { structure: s3 } = placePiece(s2, "tetrahedron", vec3(1, 0, 0));
    const counts = pieceCountByType(s3);
    expect(counts.tetrahedron).toBe(2);
    expect(counts.octahedron).toBe(0);
  });
});

describe("uniquePrimitiveTypes", () => {
  it("returns count of distinct types", () => {
    const s = createStructure("S", "node-1");
    const { structure: s2 } = placePiece(s, "tetrahedron", vec3(0, 0, 0));
    const { structure: s3 } = placePiece(s2, "octahedron", vec3(2, 0, 0));
    expect(uniquePrimitiveTypes(s3)).toBe(2);
  });

  it("returns 1 for single type", () => {
    const s = createStructure("S", "node-1");
    const { structure: s2 } = placePiece(s, "tetrahedron", vec3(0, 0, 0));
    expect(uniquePrimitiveTypes(s2)).toBe(1);
  });
});

describe("SEED_CHALLENGES order", () => {
  it("geodesic_dome is last", () => {
    expect(SEED_CHALLENGES[SEED_CHALLENGES.length - 1]?.id).toBe("geodesic_dome");
  });

  it("entanglement is coopRequired", () => {
    const c = getChallenge("entanglement");
    expect(c?.coopRequired).toBe(true);
  });
});
