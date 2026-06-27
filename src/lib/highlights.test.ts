import { describe, it, expect } from "vitest";
import { selectHighlights, rankHighlights, type HighlightInput } from "./highlights";
import { weaveMemory } from "./weave";

const photos: HighlightInput[] = [
  { id: "a", quality_score: 0.9, reactionCount: 0, commentCount: 0 },
  { id: "b", quality_score: 0.1, reactionCount: 5, commentCount: 0 },
  { id: "c", quality_score: 0.5, reactionCount: 2, commentCount: 3 },
  { id: "d", quality_score: 0.2, reactionCount: 1, commentCount: 0 },
];

describe("selectHighlights", () => {
  it("ranks the most-engaged photos first", () => {
    const ranked = rankHighlights(photos).map((p) => p.id);
    // b: 10.1, c: 8.5, d: 2.2, a: 0.9
    expect(ranked).toEqual(["b", "c", "d", "a"]);
  });

  it("returns exactly the requested number", () => {
    expect(selectHighlights(photos, 2)).toEqual(["b", "c"]);
  });

  it("is deterministic for tied scores (tie-break by id)", () => {
    const tied: HighlightInput[] = [
      { id: "z", quality_score: 0, reactionCount: 1, commentCount: 0 },
      { id: "a", quality_score: 0, reactionCount: 1, commentCount: 0 },
    ];
    expect(selectHighlights(tied, 2)).toEqual(["a", "z"]);
  });

  it("handles empty input and over-large counts", () => {
    expect(selectHighlights([], 5)).toEqual([]);
    expect(selectHighlights(photos, 99)).toHaveLength(4);
  });
});

describe("weaveMemory", () => {
  it("leads with a note when present", () => {
    const line = weaveMemory({
      locationName: "Montepulciano",
      date: "2026-09-12T18:00:00.000Z",
      topReactionEmoji: "❤️",
      notes: ["Der Abend, an dem wir den Sonnenuntergang verpasst haben"],
    });
    expect(line).toContain("Montepulciano");
    expect(line).toContain("„");
  });

  it("falls back to place + feeling without a note", () => {
    const line = weaveMemory({
      locationName: "Montepulciano",
      date: "2026-09-12T18:00:00.000Z",
      topReactionEmoji: "🔥",
      notes: [],
    });
    expect(line).toContain("Montepulciano");
    expect(line).toContain("🔥");
  });

  it("is deterministic", () => {
    const signals = {
      locationName: "Rom",
      date: "2026-09-12T00:00:00.000Z",
      topReactionEmoji: "😂",
      notes: [],
    };
    expect(weaveMemory(signals)).toBe(weaveMemory(signals));
  });

  it("never throws on empty signals", () => {
    expect(
      weaveMemory({ locationName: null, date: null, topReactionEmoji: null, notes: [] })
    ).toBeTruthy();
  });
});
