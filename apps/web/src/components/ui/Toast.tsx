import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  type?: "success" | "warning" | "error" | "info";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  message,
  onDismiss,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
    error: <XCircle className="h-4 w-4 text-rose-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-sky-400 shrink-0" />,
  };

  const borderVariants = {
    success: "border-emerald-800/60 bg-emerald-950/80 text-emerald-100",
    warning: "border-amber-800/60 bg-amber-950/80 text-amber-100",
    error: "border-rose-800/60 bg-rose-950/80 text-rose-100",
    info: "border-sky-800/60 bg-sky-950/80 text-sky-100",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 text-xs shadow-lg backdrop-blur-md transition-all",
        borderVariants[type],
        className
      )}
      role="alert"
    >
      {icons[type]}
      <p className="flex-1 font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded p-1 hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

