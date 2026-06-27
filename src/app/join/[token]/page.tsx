import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { InvitePreview } from "@/lib/supabase/types";
import { JoinButton } from "./JoinButton";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invite_preview", { p_token: token });
  const preview = (data as InvitePreview[] | null)?.[0] ?? null;
  const user = await getCurrentUser();

  if (!preview) {
    return (
      <Centered>
        <Card className="w-full max-w-sm text-center">
          <div className="text-4xl">🌫️</div>
          <h1 className="mt-3 font-display text-2xl text-ink">
            Einladung nicht gefunden
          </h1>
          <p className="mt-2 text-sm text-ink-dim">
            Dieser Link ist ungültig. Bitte deine Freund:innen um einen neuen.
          </p>
        </Card>
      </Centered>
    );
  }

  if (preview.expired) {
    return (
      <Centered>
        <Card className="w-full max-w-sm text-center">
          <div className="text-4xl">⏳</div>
          <h1 className="mt-3 font-display text-2xl text-ink">
            Einladung abgelaufen
          </h1>
          <p className="mt-2 text-sm text-ink-dim">
            Diese Einladung zu &bdquo;{preview.capsule_name}&ldquo; gilt nicht mehr.
          </p>
        </Card>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Avatar
            src={preview.inviter_avatar}
            name={preview.inviter_name}
            size={64}
          />
          <p className="text-sm text-ink-dim">
            <span className="text-ink">{preview.inviter_name}</span> hat dich
            eingeladen zu
          </p>
        </div>

        <div>
          <Eyebrow>Erlebnis-Kapsel</Eyebrow>
          <h1 className="mt-1 font-display text-4xl italic leading-tight text-ink">
            {preview.capsule_name}
          </h1>
        </div>

        <p className="text-ink-dim">
          Eure gemeinsamen Fotos entfalten sich Tag für Tag neu — bis am Ende
          euer Erinnerungs-Buch entsteht.
        </p>

        <p className="font-mono text-xs text-ink-faint">
          {preview.member_count}{" "}
          {preview.member_count === 1 ? "Mitglied" : "Mitglieder"} bereits dabei
        </p>

        <JoinButton token={token} loggedIn={Boolean(user)} />
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12">
      {children}
    </main>
  );
}
