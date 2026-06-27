import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hallo@nachklang.app";
  if (!publicKey || !privateKey) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
  } catch {
    return false;
  }
}

type PushPayload = { title: string; body: string; url: string; tag: string };

async function sendToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0 || !configure()) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Prune expired/invalid subscriptions.
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

// Sends ONE bundled notification to all members of a capsule after a drip
// release. Never one-per-photo — the cron calls this once per drip.
export async function notifyCapsuleRelease(capsuleId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: capsule } = await admin
    .from("capsules")
    .select("name")
    .eq("id", capsuleId)
    .single();

  const { data: members } = await admin
    .from("capsule_members")
    .select("user_id")
    .eq("capsule_id", capsuleId);

  const userIds = (members ?? []).map((m) => m.user_id);

  await sendToUsers(userIds, {
    title: "Nachklang",
    body: `Ein neuer Moment von „${capsule?.name ?? "eurem Erlebnis"}“ ist da ✨`,
    url: `/app/c/${capsuleId}`,
    tag: `drip-${capsuleId}`,
  });
}
