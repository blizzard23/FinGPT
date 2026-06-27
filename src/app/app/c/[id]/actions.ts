"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { runDripForCapsule } from "@/lib/drip-runner";
import { notifyCapsuleRelease } from "@/lib/push";

// Toggle whether a photo's auto-detected location is shown. Uploader-only
// (enforced by RLS too). Important for privacy, e.g. photos of children.
export async function setLocationVisible(
  photoId: string,
  capsuleId: string,
  visible: boolean
): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase
    .from("photos")
    .update({ location_visible: visible })
    .eq("id", photoId);
  revalidatePath(`/app/c/${capsuleId}`);
}

export async function deletePhoto(
  photoId: string,
  capsuleId: string
): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("photos").delete().eq("id", photoId);
  revalidatePath(`/app/c/${capsuleId}`);
}

// Owner-only dev helper: run the drip immediately instead of waiting for the
// daily cron, so the whole loop can be exercised in one sitting.
export async function triggerDripNow(capsuleId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: capsule } = await supabase
    .from("capsules")
    .select("*")
    .eq("id", capsuleId)
    .single();

  if (!capsule || capsule.owner_id !== user.id) {
    throw new Error("Nur der Ersteller kann den Drip auslösen.");
  }

  const admin = createAdminClient();
  const result = await runDripForCapsule(admin, capsule);
  if (result.releasedCount > 0) {
    await notifyCapsuleRelease(capsuleId);
  }

  revalidatePath(`/app/c/${capsuleId}`);
}
