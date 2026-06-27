"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// Redeems the invite for the logged-in user and routes into the capsule.
export async function joinCapsule(token: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_invite", { p_token: token });

  if (error) {
    return { error: "Diese Einladung ist leider nicht mehr gültig." };
  }

  redirect(`/app/c/${data}`);
}
