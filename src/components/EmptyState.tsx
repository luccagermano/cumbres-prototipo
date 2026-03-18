import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 sm:py-20 animate-fade-in", className)}>
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl scale-150" />
        <div className="relative glass-card p-5 rounded-2xl">
          <Icon className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="font-display text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm text-center leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
