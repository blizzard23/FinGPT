"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { unlockBook } from "@/app/app/c/[id]/book/actions";
import { formatEuro } from "@/lib/book-format";
import type { BookEconomics } from "@/lib/book";

export function UnlockPanel({
  capsuleId,
  economics,
}: {
  capsuleId: string;
  economics: BookEconomics;
}) {
  const [unlocked, setUnlocked] = useState(economics.unlockedByMe);
  const [unlockedCount, setUnlockedCount] = useState(economics.unlockedCount);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUnlock() {
    setError(null);
    startTransition(async () => {
      const result = await unlockBook(capsuleId);
      if (result?.error) {
        setError(result.error);
      } else {
        if (!unlocked) setUnlockedCount((c) => c + 1);
        setUnlocked(true);
      }
    });
  }

  if (unlocked) {
    return (
      <Card className="flex flex-col gap-3 bg-surface-2">
        <Eyebrow>Freigeschaltet ✨</Eyebrow>
        <p className="text-sm text-ink-dim">
          Dein Exemplar ist freigeschaltet. {unlockedCount} von{" "}
          {economics.memberCount} aus eurer Runde sind dabei.
        </p>
        <a href={`/api/capsules/${capsuleId}/book/pdf`} download>
          <Button variant="secondary" className="w-full">
            Als PDF herunterladen
          </Button>
        </a>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <Eyebrow>Euer Buch</Eyebrow>
      <h3 className="font-display text-2xl text-ink">Buch freischalten</h3>
      <p className="text-sm text-ink-dim">
        Geteilt bezahlt: dein Anteil ist nur{" "}
        <span className="text-ink">{formatEuro(economics.shareCents)}</span>{" "}
        <span className="text-ink-faint">
          ({formatEuro(economics.totalCents)} ÷ {economics.memberCount})
        </span>
        . Jede:r bekommt ein eigenes Exemplar — deins wird sofort freigeschaltet,
        unabhängig von den anderen.
      </p>
      {error && <p className="text-sm text-coral">{error}</p>}
      <Button onClick={handleUnlock} disabled={pending}>
        {pending ? "Einen Moment…" : `Meinen Anteil freischalten`}
      </Button>
      <p className="font-mono text-[0.6rem] text-ink-faint">
        MVP: erfasst nur die Kaufabsicht — es wird noch nichts abgebucht.
      </p>
    </Card>
  );
}
