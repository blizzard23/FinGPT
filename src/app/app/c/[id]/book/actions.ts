"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { DEFAULT_BOOK_TOTAL_CENTS } from "@/lib/book";

// Shared-unlock framing — captures the buy INTENT only (no real payment in the
// MVP). Each member unlocks their own copy independently of the others.
export async function unlockBook(capsuleId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: capsule }, { count: memberCount }] = await Promise.all([
    supabase.from("capsules").select("book_total_cents").eq("id", capsuleId).single(),
    supabase
      .from("capsule_members")
      .select("*", { count: "exact", head: true })
      .eq("capsule_id", capsuleId),
  ]);

  const total = capsule?.book_total_cents ?? DEFAULT_BOOK_TOTAL_CENTS;
  const shareCents = Math.ceil(total / Math.max(1, memberCount ?? 1));

  const { error } = await supabase
    .from("book_intents")
    .upsert(
      { capsule_id: capsuleId, user_id: user.id, share_cents: shareCents },
      { onConflict: "capsule_id,user_id" }
    );

  if (error) return { error: error.message };

  revalidatePath(`/app/c/${capsuleId}/book`);
  return {};
}
