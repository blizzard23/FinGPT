import Image from "next/image";
import { cn } from "@/lib/cn";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const style = { width: size, height: size };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={style}
        className={cn("rounded-full object-cover border border-line", className)}
      />
    );
  }

  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-sm text-ink-dim",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
