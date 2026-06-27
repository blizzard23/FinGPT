"use client";

import Image from "next/image";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { setLocationVisible } from "@/app/app/c/[id]/actions";

export type ContributionPhoto = {
  id: string;
  thumbUrl: string | null;
  status: "pending" | "released";
  location_name: string | null;
  location_visible: boolean;
};

export function MyContribution({
  photos,
  capsuleId,
}: {
  photos: ContributionPhoto[];
  capsuleId: string;
}) {
  if (photos.length === 0) {
    return (
      <p className="text-sm text-ink-dim">
        Du hast noch keine Fotos beigesteuert. Deine Bilder bleiben verborgen,
        bis der Drip sie freigibt.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <PhotoTile key={photo.id} photo={photo} capsuleId={capsuleId} />
      ))}
    </div>
  );
}

function PhotoTile({
  photo,
  capsuleId,
}: {
  photo: ContributionPhoto;
  capsuleId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-2">
      {photo.thumbUrl ? (
        <Image
          src={photo.thumbUrl}
          alt=""
          fill
          sizes="33vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-ink-faint">
          ✦
        </div>
      )}

      {photo.status === "pending" && (
        <span className="absolute left-1 top-1 rounded-full bg-night/70 px-2 py-0.5 font-mono text-[0.6rem] text-glow">
          wartet
        </span>
      )}

      {photo.location_name && (
        <button
          onClick={() =>
            startTransition(() =>
              setLocationVisible(photo.id, capsuleId, !photo.location_visible)
            )
          }
          disabled={pending}
          title={
            photo.location_visible
              ? `Ort sichtbar: ${photo.location_name} (tippen zum Verbergen)`
              : "Ort verborgen (tippen zum Anzeigen)"
          }
          className={cn(
            "absolute bottom-1 left-1 right-1 truncate rounded-md px-1.5 py-0.5 text-left font-mono text-[0.6rem]",
            photo.location_visible
              ? "bg-night/70 text-ink-dim"
              : "bg-night/70 text-ink-faint line-through"
          )}
        >
          📍 {photo.location_name}
        </button>
      )}
    </div>
  );
}
