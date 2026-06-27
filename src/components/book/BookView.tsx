"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import type { BookPage } from "@/lib/book";

function formatRange(start: string | null, end: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  return "";
}

export function BookView({
  title,
  start,
  end,
  memberCount,
  pages,
}: {
  title: string;
  start: string | null;
  end: string | null;
  memberCount: number;
  pages: BookPage[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const totalPages = pages.length + 1; // cover + highlights

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Cover */}
        <article className="aspect-[3/4] w-full shrink-0 snap-center">
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-glow/30 bg-gradient-to-b from-surface-2 to-dusk px-8 text-center">
            <Eyebrow>Erinnerungs-Buch</Eyebrow>
            <h2 className="font-display text-4xl italic leading-tight text-ink">
              {title}
            </h2>
            <p className="font-mono text-xs text-ink-faint">
              {formatRange(start, end)}
            </p>
            <p className="font-mono text-xs text-ink-faint">
              {memberCount} {memberCount === 1 ? "Freund:in" : "Freund:innen"}
            </p>
          </div>
        </article>

        {/* Highlight pages */}
        {pages.map((page, i) => (
          <article
            key={page.photoId}
            className="aspect-[3/4] w-full shrink-0 snap-center"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative flex-1">
                {page.imageUrl && (
                  <Image
                    src={page.imageUrl}
                    alt={page.caption}
                    fill
                    sizes="(max-width: 448px) 100vw, 448px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <p className="font-display text-lg italic leading-snug text-ink">
                  {page.caption}
                </p>
                <span className="font-mono text-[0.65rem] text-ink-faint">
                  {i + 1}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Page dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-4 bg-glow" : "w-1.5 bg-line"
            )}
          />
        ))}
      </div>
      <p className="text-center font-mono text-[0.65rem] text-ink-faint">
        ← blättern →
      </p>
    </div>
  );
}
