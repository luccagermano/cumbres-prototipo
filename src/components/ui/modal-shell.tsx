import { cn } from "@/lib/utils";
import { ReactNode, useEffect } from "react";

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

function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

export function ModalShell({ open, onClose, title, description, children, footer, size = "md" }: ModalShellProps) {
  useBodyScrollLock(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={cn("relative glass-panel w-full animate-fade-in flex flex-col max-h-[85vh]", sizeMap[size])}>
        <div className="shrink-0 mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>

        {footer && <div className="shrink-0 mt-4 pt-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "bottom";
}

export function DrawerShell({ open, onClose, title, children, footer, side = "right" }: DrawerShellProps) {
  useBodyScrollLock(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        "relative glass-panel rounded-none flex flex-col",
        side === "right"
          ? "ml-auto w-full max-w-md h-full animate-slide-in-left"
          : "mt-auto w-full max-h-[80vh] rounded-t-2xl"
      )}>
        {/* Sticky header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border/50 bg-background/60 backdrop-blur-sm flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
