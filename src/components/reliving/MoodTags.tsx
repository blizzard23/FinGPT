"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { MOODS } from "@/lib/reactions";
import { toggleMood } from "@/app/app/c/[id]/p/[photoId]/actions";
import type { MoodSummary } from "@/lib/photo-detail";

export function MoodTags({
  photoId,
  capsuleId,
  initial,
}: {
  photoId: string;
  capsuleId: string;
  initial: MoodSummary[];
}) {
  const [state, setState] = useState<Record<string, MoodSummary>>(
    Object.fromEntries(initial.map((m) => [m.mood, m]))
  );
  const [, startTransition] = useTransition();

  function handleTap(mood: string) {
    const prev = state;
    setState((s) => {
      const current = s[mood] ?? { mood, count: 0, mine: false };
      const next = {
        ...current,
        mine: !current.mine,
        count: current.count + (current.mine ? -1 : 1),
      };
      return { ...s, [mood]: next };
    });

    startTransition(async () => {
      const result = await toggleMood(photoId, capsuleId, mood);
      if (result?.error) setState(prev);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map((mood) => {
        const summary = state[mood];
        const mine = summary?.mine ?? false;
        const count = summary?.count ?? 0;
        return (
          <button
            key={mood}
            onClick={() => handleTap(mood)}
            aria-pressed={mine}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-full border px-3 py-1.5 text-lg transition-colors active:scale-95",
              mine ? "border-lilac/50 bg-surface-2" : "border-line opacity-70 hover:opacity-100"
            )}
          >
            <span>{mood}</span>
            {count > 0 && (
              <span className="font-mono text-xs text-ink-faint">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
