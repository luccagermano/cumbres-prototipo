import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="glass-card p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md text-center">{description}</p>
    </div>
  );
}
