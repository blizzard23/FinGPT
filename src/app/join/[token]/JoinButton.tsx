"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { joinCapsule } from "../actions";

export function JoinButton({ token, loggedIn }: { token: string; loggedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await joinCapsule(token);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={handleClick} disabled={pending} className="w-full">
        {pending
          ? "Einen Moment…"
          : loggedIn
            ? "Beitreten"
            : "Anmelden & beitreten"}
      </Button>
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
