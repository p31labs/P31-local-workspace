export interface TetraVertices {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  v3: [number, number, number];
  edgeLength: number;
}

export function regularTetra(R: number): TetraVertices {
  const edgeLength = R * Math.sqrt(8 / 3);
  return {
    v0: [0, R, 0],
    v1: [R * Math.sqrt(8 / 9), -R / 3, 0],
    v2: [-R * Math.sqrt(2 / 9), -R / 3, R * Math.sqrt(2 / 3)],
    v3: [-R * Math.sqrt(2 / 9), -R / 3, -R * Math.sqrt(2 / 3)],
    edgeLength,
  };
}
