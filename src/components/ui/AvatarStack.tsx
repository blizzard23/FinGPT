import { Avatar } from "@/components/ui/Avatar";

type Person = { id: string; display_name: string; avatar_url: string | null };

export function AvatarStack({
  people,
  size = 32,
  max = 5,
}: {
  people: Person[];
  size?: number;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-3">
        {shown.map((p) => (
          <Avatar
            key={p.id}
            name={p.display_name}
            src={p.avatar_url}
            size={size}
            className="ring-2 ring-night"
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="font-mono text-xs text-ink-faint">+{overflow}</span>
      )}
    </div>
  );
}
