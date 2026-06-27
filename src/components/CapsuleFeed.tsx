import Link from "next/link";
import { DevelopingImage } from "@/components/ui/DevelopingImage";
import { Card } from "@/components/ui/Card";

export type FeedPhoto = {
  id: string;
  fullUrl: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  location_name: string | null;
  location_visible: boolean;
  released_at: string | null;
};

export function CapsuleFeed({
  capsuleId,
  photos,
}: {
  capsuleId: string;
  photos: FeedPhoto[];
}) {
  if (photos.length === 0) {
    return (
      <Card className="py-8 text-center text-sm text-ink-dim">
        Noch keine Momente freigegeben. Sobald der Drip läuft, erscheinen sie
        hier — Tag für Tag.
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {photos.map((photo) => {
        const src = photo.fullUrl ?? photo.thumbUrl;
        return (
          <li key={photo.id}>
            <Link href={`/app/c/${capsuleId}/p/${photo.id}`}>
              <Card className="overflow-hidden p-0 transition-colors hover:border-glow/40">
                {src && (
                  <DevelopingImage
                    src={src}
                    alt={photo.location_name ?? "Erinnerung"}
                    width={photo.width ?? 1200}
                    height={photo.height ?? 900}
                    containerClassName="w-full"
                    className="h-auto w-full object-cover"
                  />
                )}
                {photo.location_visible && photo.location_name && (
                  <div className="px-5 py-3 font-mono text-xs text-ink-faint">
                    📍 {photo.location_name}
                  </div>
                )}
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
