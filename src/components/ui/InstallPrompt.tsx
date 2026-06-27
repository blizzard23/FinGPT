"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { isIos, isStandalone } from "@/lib/platform";
import { cn } from "@/lib/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  onDismiss?: () => void;
  onInstalled?: () => void;
  className?: string;
}

/**
 * Self-contained install affordance. Detects platform capability (Android
 * beforeinstallprompt vs. iOS manual steps) but does NOT decide *when* to
 * render — the caller controls timing (see Phase 6: tied to the install
 * moment after the first emotional beat).
 */
export function InstallPrompt({ onDismiss, onInstalled, className }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [platform, setPlatform] = useState<"ios" | "android" | "unsupported" | null>(
    null
  );

  useEffect(() => {
    if (isStandalone()) {
      setPlatform(null);
      return;
    }

    if (isIos()) {
      setPlatform("ios");
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform("android");
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!platform) return null;

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPlatform(null);
    if (outcome === "accepted") onInstalled?.();
  }

  return (
    <Card className={cn("max-w-sm", className)}>
      <Eyebrow>Damit dir kein Moment entgeht</Eyebrow>
      <h3 className="mt-2 font-display text-2xl text-ink">
        Nachklang installieren
      </h3>

      {platform === "android" && (
        <>
          <p className="mt-2 text-sm text-ink-dim">
            Installiere Nachklang auf deinem Startbildschirm, um sofort
            benachrichtigt zu werden, wenn neue Erinnerungen freigegeben werden.
          </p>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleInstallClick}>Installieren</Button>
            <Button variant="ghost" onClick={onDismiss}>
              Später
            </Button>
          </div>
        </>
      )}

      {platform === "ios" && (
        <>
          <p className="mt-2 text-sm text-ink-dim">
            Füge Nachklang zum Home-Bildschirm hinzu, um Benachrichtigungen
            über neue Erinnerungen zu erhalten.
          </p>
          <ol className="mt-4 space-y-3 text-sm text-ink-dim">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs text-glow">
                1
              </span>
              Tippe unten auf das Teilen-Symbol{" "}
              <ShareIcon className="inline h-4 w-4 text-glow" />
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs text-glow">
                2
              </span>
              Wähle &bdquo;Zum Home-Bildschirm&ldquo;
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line font-mono text-xs text-glow">
                3
              </span>
              Tippe auf &bdquo;Hinzufügen&ldquo;
            </li>
          </ol>
          <div className="mt-4">
            <Button variant="ghost" onClick={onDismiss}>
              Verstanden
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  );
}
