import "server-only";

// Push fan-out. Fully implemented in Phase 6 (web-push + VAPID). The drip cron
// already calls this seam so wiring real delivery is a drop-in change.
export async function notifyCapsuleRelease(_capsuleId: string): Promise<void> {
  // Phase 6: look up members' push_subscriptions and send ONE bundled
  // notification ("Ein neuer Moment von {Kapsel} ist da ✨").
}
