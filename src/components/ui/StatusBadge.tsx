import { cn } from "@/lib/cn";
import type { CapsuleStatus } from "@/lib/supabase/types";

const LABELS: Record<CapsuleStatus, string> = {
  draft: "Entwurf",
  active: "Läuft",
  completed: "Abgeschlossen",
};

const STYLES: Record<CapsuleStatus, string> = {
  draft: "text-ink-dim border-line",
  active: "text-glow border-glow/40",
  completed: "text-lilac border-lilac/40",
};

export function StatusBadge({ status }: { status: CapsuleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em]",
        STYLES[status]
      )}
    >
      {LABELS[status]}
    </span>
  );
}
