import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-6",
        hover && "cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel p-8", className)}>
      {children}
    </div>
  );
}
