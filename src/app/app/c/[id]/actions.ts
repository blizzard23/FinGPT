"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

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
