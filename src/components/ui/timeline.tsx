import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "error";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotVariants = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-6">
        {items.map((item) => {
          const Icon = item.icon;
          const variant = item.variant || "default";
          return (
            <div key={item.id} className="relative flex gap-4 pl-8">
              {/* Dot */}
              <div
                className={cn(
                  "absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 border-background flex items-center justify-center",
                  dotVariants[variant]
                )}
              >
                {Icon && <Icon className="h-3 w-3 text-primary-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
