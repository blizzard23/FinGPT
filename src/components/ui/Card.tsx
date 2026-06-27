import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_0_rgba(244,236,226,0.04)_inset]",
        className
      )}
      {...props}
    />
  );
}
