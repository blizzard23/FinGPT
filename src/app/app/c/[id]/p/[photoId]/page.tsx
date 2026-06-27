import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotoDetail } from "@/lib/photo-detail";
import { getCurrentProfile } from "@/lib/auth";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DevelopingImage } from "@/components/ui/DevelopingImage";
import { ReactionBar } from "@/components/reliving/ReactionBar";
import { MoodTags } from "@/components/reliving/MoodTags";
import { NoteComposer } from "@/components/reliving/NoteComposer";
import { CommentsThread } from "@/components/reliving/CommentsThread";
import { LocationLine } from "@/components/reliving/LocationLine";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ id: string; photoId: string }>;
}) {
  const { id: capsuleId, photoId } = await params;

  const [detail, profile] = await Promise.all([
    getPhotoDetail(photoId),
    getCurrentProfile(),
  ]);
  if (!detail) notFound();

  const { photo, uploader, fullUrl, reactions, moods, notes, comments } = detail;
  const isUploader = profile?.id === photo.uploader_id;
  const takenLabel = formatDate(photo.taken_at ?? photo.released_at);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <Link href={`/app/c/${capsuleId}`} className="font-mono text-xs text-ink-faint">
        ← Zur Kapsel
      </Link>

      {fullUrl && (
        <DevelopingImage
          src={fullUrl}
          alt={photo.location_name ?? "Erinnerung"}
          width={photo.width ?? 1200}
          height={photo.height ?? 900}
          containerClassName="w-full overflow-hidden rounded-2xl border border-line"
          className="h-auto w-full object-cover"
        />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-ink-faint">
            {uploader?.display_name ?? "Freund:in"}
            {takenLabel ? ` · ${takenLabel}` : ""}
          </p>
        </div>
        {photo.location_name && (
          <LocationLine
            photoId={photo.id}
            capsuleId={capsuleId}
            locationName={photo.location_name}
            visible={photo.location_visible}
            canToggle={isUploader}
          />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <ReactionBar photoId={photo.id} capsuleId={capsuleId} initial={reactions} />
      </section>

      <section className="flex flex-col gap-2">
        <Eyebrow>Wie war dieser Moment?</Eyebrow>
        <MoodTags photoId={photo.id} capsuleId={capsuleId} initial={moods} />
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Die Geschichte dahinter</Eyebrow>
        {notes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <p className="text-sm text-ink">{note.body}</p>
                <p className="mt-1 font-mono text-[0.65rem] text-ink-faint">
                  {note.author?.display_name ?? "Freund:in"}
                  {note.source === "voice" ? " · 🎙 gesprochen" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        <NoteComposer photoId={photo.id} capsuleId={capsuleId} />
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Gespräch</Eyebrow>
        <CommentsThread
          photoId={photo.id}
          capsuleId={capsuleId}
          initial={comments.map((c) => ({
            id: c.id,
            body: c.body,
            created_at: c.created_at,
            user_id: c.user_id,
            authorName: c.author?.display_name ?? "Freund:in",
            authorAvatar: c.author?.avatar_url ?? null,
          }))}
          currentUser={{
            id: profile?.id ?? "",
            name: profile?.display_name ?? "Du",
            avatar: profile?.avatar_url ?? null,
          }}
        />
      </section>
    </main>
  );
}
