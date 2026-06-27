"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createInviteLink } from "@/app/app/actions";

export function InviteButton({ capsuleId }: { capsuleId: string }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const url = await createInviteLink(capsuleId);
      setLink(url);

      // Prefer the native share sheet (this is the viral moment in a chat).
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "Komm in unsere Erlebnis-Kapsel",
            text: "Ich hab dich zu unseren gemeinsamen Erinnerungen eingeladen ✨",
            url,
          });
          return;
        } catch {
          // Share cancelled — fall back to copy below.
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard blocked — the link is shown below for manual copy.
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={pending} variant="secondary">
        {pending ? "Link wird erstellt…" : copied ? "Link kopiert ✓" : "Freund:innen einladen"}
      </Button>
      {link && (
        <p className="break-all rounded-xl border border-line bg-night px-3 py-2 font-mono text-xs text-ink-dim">
          {link}
        </p>
      )}
    </div>
  );
}
