"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <Card className="w-full max-w-sm text-center">
        <div className="text-4xl">📨</div>
        <h2 className="mt-3 font-display text-2xl text-ink">Schau in dein Postfach</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Wir haben dir einen Link an{" "}
          <span className="text-ink">{state.email}</span> geschickt. Tippe darauf,
          um dich anzumelden.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <Eyebrow>Anmelden</Eyebrow>
      <h2 className="mt-2 font-display text-3xl text-ink">Willkommen</h2>
      <p className="mt-1 text-sm text-ink-dim">
        Gib deine E-Mail ein — wir schicken dir einen Anmelde-Link. Kein Passwort
        nötig.
      </p>

      <form action={formAction} className="mt-5 flex flex-col gap-3">
        {next && <input type="hidden" name="next" value={next} />}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="du@beispiel.de"
          className="min-h-12 rounded-full border border-line bg-night px-5 text-ink placeholder:text-ink-faint focus:border-glow focus:outline-none"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gesendet…" : "Link senden"}
        </Button>
        {state.status === "error" && (
          <p className="text-sm text-coral">{state.message}</p>
        )}
      </form>
    </Card>
  );
}
