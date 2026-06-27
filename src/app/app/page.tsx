import { requireUser, getCurrentProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { Eyebrow } from "@/components/ui/Eyebrow";

// Placeholder authenticated home. Phase 2 replaces this with the capsule list.
export default async function AppHome() {
  await requireUser("/app");
  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <Eyebrow>Angemeldet</Eyebrow>
        <SignOutButton />
      </div>
      <h1 className="font-display text-3xl text-ink">
        Hallo {profile?.display_name ?? "Freund:in"}
      </h1>
      <p className="text-ink-dim">
        Deine Erlebnis-Kapseln erscheinen hier. (Phase 2)
      </p>
    </main>
  );
}
