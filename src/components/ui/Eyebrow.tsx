import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-mono text-xs uppercase tracking-[0.18em] text-glow",
        className
      )}
      {...props}
    />
  );
}
