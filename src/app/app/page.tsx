import Link from "next/link";
import { listMyCapsules } from "@/lib/capsules";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AppHome() {
  const capsules = await listMyCapsules();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Deine Kapseln</h1>
        <Link href="/app/new">
          <Button className="px-4">Neu</Button>
        </Link>
      </div>

      {capsules.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="text-4xl">🌅</div>
          <div>
            <h2 className="font-display text-2xl text-ink">Noch nichts hier</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Leg eine Erlebnis-Kapsel an und lade deine Freund:innen ein.
            </p>
          </div>
          <Link href="/app/new">
            <Button>Erste Kapsel anlegen</Button>
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {capsules.map((capsule) => (
            <li key={capsule.id}>
              <Link href={`/app/c/${capsule.id}`}>
                <Card className="flex flex-col gap-3 transition-colors hover:border-glow/40">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl text-ink">{capsule.name}</h3>
                    <StatusBadge status={capsule.status} />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-ink-faint">
                    <span>
                      {capsule.member_count}{" "}
                      {capsule.member_count === 1 ? "Mitglied" : "Mitglieder"}
                    </span>
                    <span>
                      {capsule.released_count}/{capsule.total_count} Fotos
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Eyebrow className="mt-2 text-center text-ink-faint">
        Privat · nur für eingeladene Freund:innen
      </Eyebrow>
    </main>
  );
}
