import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function ModalShell({ open, onClose, title, description, children, footer, size = "md" }: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={cn("relative glass-panel w-full animate-fade-in", sizeMap[size])}>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>

        <div className="min-h-0">{children}</div>

        {footer && <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "right" | "bottom";
}

export function DrawerShell({ open, onClose, title, children, side = "right" }: DrawerShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        "relative glass-panel rounded-none",
        side === "right"
          ? "ml-auto w-full max-w-md h-full animate-slide-in-left"
          : "mt-auto w-full max-h-[80vh] rounded-t-2xl"
      )}>
        <div className="flex items-center justify-between mb-4 p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">✕</button>
        </div>
        <div className="p-6 pt-2 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
