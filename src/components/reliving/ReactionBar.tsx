"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { REACTIONS } from "@/lib/reactions";
import { toggleReaction } from "@/app/app/c/[id]/p/[photoId]/actions";
import type { ReactionSummary } from "@/lib/photo-detail";
import type { ReactionType } from "@/lib/supabase/types";

export function ReactionBar({
  photoId,
  capsuleId,
  initial,
}: {
  photoId: string;
  capsuleId: string;
  initial: ReactionSummary[];
}) {
  const [state, setState] = useState(initial);
  const [, startTransition] = useTransition();

  function handleTap(type: ReactionType) {
    const prev = state;
    // Optimistic update.
    setState((s) =>
      s.map((r) =>
        r.type === type
          ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) }
          : r
      )
    );

    startTransition(async () => {
      const result = await toggleReaction(photoId, capsuleId, type);
      if (result?.error) setState(prev); // rollback
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ type, emoji, label }) => {
        const summary = state.find((r) => r.type === type);
        const mine = summary?.mine ?? false;
        const count = summary?.count ?? 0;
        return (
          <button
            key={type}
            onClick={() => handleTap(type)}
            aria-pressed={mine}
            aria-label={label}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors active:scale-95",
              mine
                ? "border-glow/50 bg-surface-2 text-ink"
                : "border-line text-ink-dim hover:border-glow/30"
            )}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && <span className="font-mono text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
