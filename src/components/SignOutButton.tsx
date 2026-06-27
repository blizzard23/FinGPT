import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button type="submit" variant="ghost" className="px-3 text-sm">
        Abmelden
      </Button>
    </form>
  );
}
