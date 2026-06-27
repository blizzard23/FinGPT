"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { startCapsule } from "@/app/app/actions";

export function StartCapsuleButton({ capsuleId }: { capsuleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => startCapsule(capsuleId))}
      disabled={pending}
      className="w-full"
    >
      {pending ? "Wird gestartet…" : "Erlebnis starten ✨"}
    </Button>
  );
}
