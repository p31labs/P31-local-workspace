export interface WordTile {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface PoetryState {
  boards: { id: string; name: string; tiles: WordTile[] }[];
  activeBoard: number;
}
