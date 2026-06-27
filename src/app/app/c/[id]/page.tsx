import Link from "next/link";
import { notFound } from "next/navigation";
import { getCapsule, getCapsuleMembers, getReleasedPhotos } from "@/lib/capsules";
import { getMyPhotos, withSignedUrls } from "@/lib/photos";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { InviteButton } from "@/components/InviteButton";
import { StartCapsuleButton } from "@/components/StartCapsuleButton";
import { PhotoUploader } from "@/components/PhotoUploader";
import { MyContribution } from "@/components/MyContribution";
import { CapsuleFeed } from "@/components/CapsuleFeed";
import { TriggerDripButton } from "@/components/TriggerDripButton";

export default async function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [capsule, user] = await Promise.all([getCapsule(id), getCurrentUser()]);
  if (!capsule) notFound();

  const [members, myPhotosRaw, releasedRaw] = await Promise.all([
    getCapsuleMembers(id),
    getMyPhotos(id),
    getReleasedPhotos(id),
  ]);
  const [myPhotos, released] = await Promise.all([
    withSignedUrls(myPhotosRaw),
    withSignedUrls(releasedRaw),
  ]);
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
        <div className="flex items-center justify-between">
          <AvatarStack people={members.map((m) => m.profile)} />
          {isOwner && capsule.status === "active" && (
            <TriggerDripButton capsuleId={capsule.id} />
          )}
        </div>
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

      {capsule.status === "completed" && (
        <Link href={`/app/c/${capsule.id}/book`}>
          <Card className="flex items-center justify-between gap-3 border-glow/30 bg-gradient-to-r from-surface-2 to-surface transition-colors hover:border-glow/50">
            <div>
              <Eyebrow>Der Höhepunkt</Eyebrow>
              <p className="mt-1 font-display text-xl text-ink">
                Euer Erinnerungs-Buch ist fertig
              </p>
            </div>
            <span className="text-2xl">📖</span>
          </Card>
        </Link>
      )}

      {capsule.status !== "draft" && (
        <section className="flex flex-col gap-3">
          <Eyebrow>Eure Momente</Eyebrow>
          <CapsuleFeed
            capsuleId={capsule.id}
            photos={released.map((p) => ({
              id: p.id,
              fullUrl: p.fullUrl,
              thumbUrl: p.thumbUrl,
              width: p.width,
              height: p.height,
              location_name: p.location_name,
              location_visible: p.location_visible,
              released_at: p.released_at,
            }))}
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <Eyebrow>Dein Beitrag</Eyebrow>
        <PhotoUploader capsuleId={capsule.id} />
        <MyContribution
          capsuleId={capsule.id}
          photos={myPhotos.map((p) => ({
            id: p.id,
            thumbUrl: p.thumbUrl,
            status: p.status,
            location_name: p.location_name,
            location_visible: p.location_visible,
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Einladen</Eyebrow>
        <InviteButton capsuleId={capsule.id} />
      </section>
    </main>
  );
}
