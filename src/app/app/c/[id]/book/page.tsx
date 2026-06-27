import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/book";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BookView } from "@/components/book/BookView";
import { UnlockPanel } from "@/components/book/UnlockPanel";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const { capsule, dateRange, pages, economics } = book;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href={`/app/c/${id}`} className="font-mono text-xs text-ink-faint">
          ← Zur Kapsel
        </Link>
        <Eyebrow>Der Höhepunkt</Eyebrow>
        <h1 className="font-display text-3xl text-ink">Euer Erinnerungs-Buch</h1>
      </div>

      {capsule.status !== "completed" && (
        <Card className="bg-surface-2 text-sm text-ink-dim">
          Dieses Buch ist eine Vorschau. Es wird vollständig, sobald euer Drip
          abgeschlossen ist — die schönsten Momente kommen zum Schluss.
        </Card>
      )}

      {pages.length === 0 ? (
        <Card className="py-8 text-center text-sm text-ink-dim">
          Sobald Fotos freigegeben sind, verdichten sich eure Highlights hier zu
          einem Buch.
        </Card>
      ) : (
        <BookView
          title={capsule.name}
          start={dateRange.start}
          end={dateRange.end}
          memberCount={economics.memberCount}
          pages={pages}
        />
      )}

      <UnlockPanel capsuleId={id} economics={economics} />
    </main>
  );
}
