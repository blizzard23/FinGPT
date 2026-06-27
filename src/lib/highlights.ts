// Highlight selection for the memory book. Pure and deterministic so it can be
// unit-tested and swapped later.

export type HighlightInput = {
  id: string;
  quality_score: number;
  reactionCount: number;
  commentCount: number;
};

export type ScoredHighlight = HighlightInput & { score: number };

// Engagement dominates (the group decided what mattered), quality breaks ties
// and lifts quietly-loved shots.
export function scoreHighlight(photo: HighlightInput): number {
  return photo.reactionCount * 2 + photo.commentCount * 1.5 + photo.quality_score;
}

export function rankHighlights(photos: HighlightInput[]): ScoredHighlight[] {
  return photos
    .map((p) => ({ ...p, score: scoreHighlight(p) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Deterministic tie-break.
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

export function selectHighlights(
  photos: HighlightInput[],
  count: number
): string[] {
  return rankHighlights(photos)
    .slice(0, Math.max(0, count))
    .map((p) => p.id);
}
