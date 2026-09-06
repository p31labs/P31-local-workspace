/**
 * Wordle-style scoring for 5-letter guesses (deterministic, duplicate-aware).
 */

export type MeshwordTile = "correct" | "present" | "absent";

export function scoreMeshwordGuess(target: string, guess: string): MeshwordTile[] {
  const t = target.toUpperCase();
  const g = guess.toUpperCase();
  if (t.length !== 5 || g.length !== 5) {
    throw new Error("meshword: expected length 5");
  }
  const result: MeshwordTile[] = Array(5).fill("absent");
  const remaining = new Map<string, number>();
  for (const ch of t) {
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1);
  }
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = "correct";
      const ch = g[i]!;
      remaining.set(ch, (remaining.get(ch) ?? 1) - 1);
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const ch = g[i]!;
    const n = remaining.get(ch) ?? 0;
    if (n > 0) {
      result[i] = "present";
      remaining.set(ch, n - 1);
    }
  }
  return result;
}

export function tilesToEmoji(row: MeshwordTile[]): string {
  const map: Record<MeshwordTile, string> = {
    correct: "🟩",
    present: "🟨",
    absent: "⬛",
  };
  return row.map((x) => map[x]).join("");
}
