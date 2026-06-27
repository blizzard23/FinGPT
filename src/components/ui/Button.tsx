import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-glow text-night hover:bg-glow-bright active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-ink border border-line hover:border-glow active:scale-[0.98]",
  ghost: "bg-transparent text-ink-dim hover:text-ink",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-base font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
