interface CosineTask {
  id: number;
  embedding: number[];
  entries: Array<{ source_door: string; raw_text: string; embedding: number[] }>;
  limit: number;
}

interface CosineResult {
  id: number;
  results: Array<{ source_door: string; raw_text: string; score: number }>;
}

const dotProduct = (a: number[], b: number[]) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
};

const magnitude = (a: number[]) => Math.sqrt(dotProduct(a, a));

self.onmessage = (e: MessageEvent<CosineTask>) => {
  const { id, embedding, entries, limit } = e.data;
  const magA = magnitude(embedding);
  if (magA === 0) {
    const result: CosineResult = { id, results: [] };
    self.postMessage(result);
    return;
  }

  const scored = [];
  for (const entry of entries) {
    const magB = magnitude(entry.embedding);
    if (magB === 0) continue;
    const score = dotProduct(embedding, entry.embedding) / (magA * magB);
    scored.push({ source_door: entry.source_door, raw_text: entry.raw_text, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const result: CosineResult = { id, results: scored.slice(0, limit) };
  self.postMessage(result);
};
