import { Unit, Pos, GRID_SIZE, inRange } from './types.ts';

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function nearestEnemy(unit: Unit, enemies: Unit[]): Unit | null {
  let best: Unit | null = null;
  let bestDist = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = manhattan(unit.pos, e.pos);
    if (d < bestDist) { bestDist = d; best = e; }
  }
  return best;
}

function adjacentPositions(pos: Pos): Pos[] {
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const result: Pos[] = [];
  for (const [dx, dy] of dirs) {
    const nx = pos.x + dx, ny = pos.y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      result.push({ x: nx, y: ny });
    }
  }
  return result;
}

function isOccupied(pos: Pos, friendlyUnits: Unit[]): boolean {
  return friendlyUnits.some(u => u.hp > 0 && u.pos.x === pos.x && u.pos.y === pos.y);
}

export function computeAiMove(
  units: Unit[],
  playerUnits: Unit[],
): { unitId: string; action: 'attack' | 'move'; target: Pos } | null {
  const aiUnits = units.filter(u => u.player === 2 && u.hp > 0);
  const enemies = playerUnits.filter(u => u.hp > 0);
  if (aiUnits.length === 0 || enemies.length === 0) return null;

  for (const unit of aiUnits) {
    const target = nearestEnemy(unit, enemies);
    if (!target) continue;
    if (inRange(unit.pos, target.pos, unit.range)) {
      return { unitId: unit.id, action: 'attack', target: target.pos };
    }
  }

  for (const unit of aiUnits) {
    const target = nearestEnemy(unit, enemies);
    if (!target) continue;
    const adj = adjacentPositions(unit.pos);
    let bestMove: Pos | null = null;
    let bestDist = manhattan(unit.pos, target.pos);
    for (const p of adj) {
      if (isOccupied(p, aiUnits)) continue;
      const d = manhattan(p, target.pos);
      if (d < bestDist) { bestDist = d; bestMove = p; }
    }
    if (bestMove) {
      return { unitId: unit.id, action: 'move', target: bestMove };
    }
  }

  return null;
}
