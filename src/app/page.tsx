import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DevelopingImage } from "@/components/ui/DevelopingImage";

const members = ["Lina Vogt", "Tom Brandt", "Ana Keller", "Jonas Wirth"];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <Eyebrow>Erlebnis-Kapsel</Eyebrow>
        <h1 className="font-display text-4xl italic leading-tight text-ink">
          Toskana,
          <br />
          September
        </h1>
        <p className="text-ink-dim">
          Ein Foto pro Tag entfaltet sich neu — bis euer Erlebnis komplett ist.
        </p>
      </header>

      <section className="flex items-center gap-2">
        <div className="flex -space-x-3">
          {members.map((name) => (
            <Avatar key={name} name={name} size={36} className="ring-2 ring-night" />
          ))}
        </div>
        <span className="font-mono text-xs text-ink-faint">
          {members.length} Mitglieder
        </span>
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Heute freigegeben</Eyebrow>
        <Card className="overflow-hidden p-0">
          <DevelopingImage
            src="/demo/sample-photo.jpg"
            alt="Sonnenuntergang mit Freunden"
            width={1200}
            height={900}
            containerClassName="aspect-[4/3] w-full"
            className="h-full w-full object-cover"
          />
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-display text-xl text-ink">Abend am Hügel</p>
              <p className="font-mono text-xs text-ink-faint">Montepulciano · Tag 6</p>
            </div>
            <span className="text-2xl">✨</span>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Link href="/app">
          <Card className="flex items-center justify-between gap-4 bg-surface-2 transition-colors hover:border-glow/40">
            <div>
              <Eyebrow>Drip läuft</Eyebrow>
              <p className="mt-1 text-sm text-ink-dim">
                Noch 9 Tage, bis euer Buch fertig ist.
              </p>
            </div>
            <Button>Loslegen</Button>
          </Card>
        </Link>
      </section>
    </main>
  );
}
