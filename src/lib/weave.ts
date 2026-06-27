// "Die Erinnerung schreibt sich selbst" — condense existing signals (place,
// date, the group's strongest reaction, a note) into ONE short memory line.
//
// Deliberately deterministic and dependency-free so it has a testable interface.
// Swap this implementation for an LLM call later without touching callers.

export type WeaveSignals = {
  locationName: string | null;
  date: string | null; // ISO timestamp
  topReactionEmoji: string | null;
  notes: string[];
};

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

function firstSentence(note: string): string {
  const trimmed = note.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117).trimEnd()}…`;
}

// Verdichten, nicht zumüllen: one place, one feeling, one line.
export function weaveMemory(signals: WeaveSignals): string {
  const place = signals.locationName?.trim() || null;
  const date = formatDate(signals.date);
  const note = signals.notes.find((n) => n.trim().length > 0);

  // A real note is the richest signal — lead with it.
  if (note) {
    const context = [place, date].filter(Boolean).join(", ");
    const quote = `„${firstSentence(note)}“`;
    return context ? `${quote} — ${context}` : quote;
  }

  const head = [place, date].filter(Boolean).join(", ");
  const feeling = signals.topReactionEmoji
    ? `ein Moment, der bei allen ${signals.topReactionEmoji} auslöste`
    : "ein Moment, den ihr geteilt habt";

  return head ? `${head} — ${feeling}.` : `${feeling[0].toUpperCase()}${feeling.slice(1)}.`;
}
