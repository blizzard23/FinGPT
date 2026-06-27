import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { MomentPrompt } from "@/components/MomentPrompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/app");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-night/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4">
          <Link href="/app" className="font-display text-xl italic text-ink">
            Nachklang
          </Link>
          <SignOutButton />
        </div>
      </header>
      {children}
      <MomentPrompt />
    </div>
  );
}
