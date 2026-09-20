import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const variants = {
    default: "bg-indigo-950/80 text-indigo-300 border border-indigo-800/50",
    success: "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50",
    warning: "bg-amber-950/80 text-amber-300 border border-amber-800/50",
    error: "bg-rose-950/80 text-rose-300 border border-rose-800/50",
    info: "bg-sky-950/80 text-sky-300 border border-sky-800/50",
    neutral: "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

