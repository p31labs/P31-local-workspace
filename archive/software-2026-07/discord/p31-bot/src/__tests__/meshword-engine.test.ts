import { describe, it, expect } from "vitest";
import { scoreMeshwordGuess, tilesToEmoji } from "../lib/meshword-engine";

describe("scoreMeshwordGuess", () => {
  it("all green when exact match", () => {
    const r = scoreMeshwordGuess("GRAPH", "GRAPH");
    expect(r.every((x) => x === "correct")).toBe(true);
  });

  it("handles duplicate letters like classic Wordle", () => {
    const r = scoreMeshwordGuess("SPOON", "NOONS");
    expect(r).toEqual(["present", "present", "correct", "absent", "present"]);
  });

  it("only one yellow when target has single letter", () => {
    const r = scoreMeshwordGuess("GRAPH", "PPPPP");
    const yellows = r.filter((x) => x === "present").length;
    const greens = r.filter((x) => x === "correct").length;
    expect(greens).toBe(1);
    expect(yellows).toBe(0);
  });
});

describe("tilesToEmoji", () => {
  it("renders a row", () => {
    expect(tilesToEmoji(["correct", "present", "absent", "absent", "correct"])).toBe(
      "🟩🟨⬛⬛🟩",
    );
  });
});
