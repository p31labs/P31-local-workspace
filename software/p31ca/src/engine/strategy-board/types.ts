export interface Pos { x: number; y: number; }

export interface Unit {
  id: string;
  type: 'soldier' | 'tank' | 'archer';
  pos: Pos;
  hp: number;
  maxHp: number;
  atk: number;
  mov: number;
  range: number;
  player: 1 | 2;
}

export type Tile = 'grass' | 'forest' | 'water';

export interface GameState {
  grid: Tile[][];
  units: Unit[];
  turn: 1 | 2;
  selected: string | null;
  phase: 'place' | 'move' | 'attack' | 'ai' | 'done';
  winner: 1 | 2 | null;
  movesLeft: number;
  message: string;
}

export const GRID_SIZE = 8;
export const TILES: Tile[][] = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => 'grass')
);

export function createUnit(id: string, type: Unit['type'], pos: Pos, player: 1 | 2): Unit {
  const stats = {
    soldier: { hp: 2, atk: 1, mov: 1, range: 1 },
    tank: { hp: 3, atk: 2, mov: 1, range: 1 },
    archer: { hp: 1, atk: 1, mov: 1, range: 2 },
  };
  const s = stats[type];
  return { id, type, pos, hp: s.hp, maxHp: s.hp, atk: s.atk, mov: s.mov, range: s.range, player };
}

export function inRange(a: Pos, b: Pos, dist: number): boolean {
  return Math.abs(a.x - b.x) <= dist && Math.abs(a.y - b.y) <= dist;
}

export function tileAt(pos: Pos): Tile {
  if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return 'water';
  return TILES[pos.y][pos.x];
}
