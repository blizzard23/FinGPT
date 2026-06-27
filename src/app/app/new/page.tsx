import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NewCapsuleForm } from "./NewCapsuleForm";

export default function NewCapsulePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link href="/app" className="font-mono text-xs text-ink-faint">
          ← Zurück
        </Link>
        <Eyebrow>Neue Erlebnis-Kapsel</Eyebrow>
        <h1 className="font-display text-3xl text-ink">
          Haltet einen Moment fest
        </h1>
        <p className="text-sm text-ink-dim">
          Ihr ladet eure Fotos hinein — und erlebt sie dosiert noch einmal,
          Tag für Tag.
        </p>
      </div>

      <NewCapsuleForm />
    </main>
  );
}
