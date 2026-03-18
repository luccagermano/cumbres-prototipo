import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: string[];
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border">/</span>}
              <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{item}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
