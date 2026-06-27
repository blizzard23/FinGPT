"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { isPushSupported, subscribeToPush } from "@/lib/push-client";
import { isIos, isStandalone } from "@/lib/platform";

const DISMISS_KEY = "nachklang:moment-prompt-dismissed";

// Shown ONCE, after the first photo finishes developing — the emotional beat.
// Couples PWA installation with the push opt-in (on iOS push only works once the
// PWA is installed, so the two are presented as a single moment). Degrades
// gracefully where push isn't available.
export function MomentPrompt() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if ("Notification" in window && Notification.permission === "granted") return;

    const onDeveloped = () => setVisible(true);
    window.addEventListener("nachklang:developed", onDeveloped, { once: true });
    return () => window.removeEventListener("nachklang:developed", onDeveloped);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function enablePush() {
    setPending(true);
    const ok = await subscribeToPush();
    setPending(false);
    if (ok) {
      setSubscribed(true);
      setTimeout(dismiss, 1500);
    }
  }

  if (!visible) return null;

  const iosNeedsInstall = isIos() && !isStandalone();
  const canPushHere = isPushSupported() && !iosNeedsInstall;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6">
      <div className="w-full max-w-sm">
        {iosNeedsInstall ? (
          // On iOS, installation is the prerequisite for notifications.
          <InstallPrompt onDismiss={dismiss} />
        ) : (
          <Card>
            <Eyebrow>Damit dir kein Moment entgeht</Eyebrow>
            <h3 className="mt-2 font-display text-2xl text-ink">
              {subscribed ? "Du bist dabei ✨" : "Sag Bescheid bei neuen Momenten"}
            </h3>
            {!subscribed && (
              <p className="mt-2 text-sm text-ink-dim">
                Wir schicken dir eine sanfte Erinnerung, sobald sich ein neues
                Foto entwickelt — höchstens einmal pro Schub.
              </p>
            )}
            <div className="mt-4 flex gap-3">
              {!subscribed && canPushHere && (
                <Button onClick={enablePush} disabled={pending}>
                  {pending ? "Einen Moment…" : "Benachrichtigen"}
                </Button>
              )}
              <Button variant="ghost" onClick={dismiss}>
                {subscribed ? "Schließen" : "Vielleicht später"}
              </Button>
            </div>
            {!canPushHere && !subscribed && (
              <p className="mt-3 font-mono text-[0.65rem] text-ink-faint">
                Benachrichtigungen sind auf diesem Gerät nicht verfügbar.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
