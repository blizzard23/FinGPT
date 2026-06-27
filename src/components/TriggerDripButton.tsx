"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { triggerDripNow } from "@/app/app/c/[id]/actions";

// Dev/owner affordance to advance the drip without waiting for real days.
export function TriggerDripButton({ capsuleId }: { capsuleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      className="px-3 text-xs"
      onClick={() => startTransition(() => triggerDripNow(capsuleId))}
      disabled={pending}
    >
      {pending ? "läuft…" : "Drip jetzt auslösen"}
    </Button>
  );
}
