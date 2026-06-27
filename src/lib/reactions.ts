import type { ReactionType } from "@/lib/supabase/types";

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "love", emoji: "❤️", label: "Liebe" },
  { type: "fire", emoji: "🔥", label: "Stark" },
  { type: "laugh", emoji: "😂", label: "Lustig" },
  { type: "like", emoji: "✨", label: "Schön" },
];

// Collective mood tags — a single tap, no typing.
export const MOODS: string[] = ["😍", "😂", "🥹", "🤩", "😌", "🔥"];
