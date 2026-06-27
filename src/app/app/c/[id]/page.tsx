import Link from "next/link";
import { notFound } from "next/navigation";
import { getCapsule, getCapsuleMembers } from "@/lib/capsules";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { InviteButton } from "@/components/InviteButton";
import { StartCapsuleButton } from "@/components/StartCapsuleButton";

export default async function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [capsule, user] = await Promise.all([getCapsule(id), getCurrentUser()]);
  if (!capsule) notFound();

  const members = await getCapsuleMembers(id);
  const isOwner = user?.id === capsule.owner_id;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-3">
        <Link href="/app" className="font-mono text-xs text-ink-faint">
          ← Alle Kapseln
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-4xl italic leading-tight text-ink">
            {capsule.name}
          </h1>
          <StatusBadge status={capsule.status} />
        </div>
        <AvatarStack people={members.map((m) => m.profile)} />
      </div>

      {capsule.status === "draft" && (
        <Card className="flex flex-col gap-4 bg-surface-2">
          <div>
            <Eyebrow>Entwurf</Eyebrow>
            <p className="mt-1 text-sm text-ink-dim">
              Ladet eure Fotos hoch und Freund:innen ein. Wenn alle bereit sind,
              startet das Erlebnis.
            </p>
          </div>
          {isOwner ? (
            <StartCapsuleButton capsuleId={capsule.id} />
          ) : (
            <p className="font-mono text-xs text-ink-faint">
              Nur {members.find((m) => m.role === "owner")?.profile.display_name ??
                "der Ersteller"}{" "}
              kann das Erlebnis starten.
            </p>
          )}
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <Eyebrow>Fotos</Eyebrow>
        <Card className="py-8 text-center text-sm text-ink-dim">
          Foto-Upload & Feed folgen (Phase 3 & 4).
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Einladen</Eyebrow>
        <InviteButton capsuleId={capsule.id} />
      </section>
    </main>
  );
}
