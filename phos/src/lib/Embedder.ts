import { endpoints } from '../config/endpoints';
import { ingestToChaosVault } from './ChaosVault';

const VECTOR_PROXY = endpoints.vectorProxy;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(VECTOR_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: text,
        model: 'nomic-embed-text:latest',
      }),
    });
    if (!response.ok) throw new Error(`HTTP_VECTOR_ERR_${response.status}`);
    const json = await response.json();
    return json.data?.[0]?.embedding || new Array(768).fill(0);
  } catch {
    return new Array(768).fill(0);
  }
}

export async function ingestAndEmbed(door: string, text: string): Promise<boolean> {
  if (!text.trim()) return false;
  const embedding = await generateEmbedding(text);
  await ingestToChaosVault(door, text, embedding);
  return true;
}
