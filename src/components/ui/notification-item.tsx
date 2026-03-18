import { cn } from "@/lib/utils";
import { Bell, Circle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface NotificationItemProps {
  title: string;
  message: string;
  time: string;
  read?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function NotificationItem({
  title,
  message,
  time,
  read = false,
  icon: Icon = Bell,
  onClick,
  className,
}: NotificationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
        read
          ? "bg-card border-border/50"
          : "bg-primary/[0.03] border-primary/20 hover:bg-primary/[0.06]",
        className
      )}
    >
      <div className={cn(
        "p-2 rounded-lg shrink-0",
        read ? "bg-muted" : "bg-primary/10"
      )}>
        <Icon className={cn("h-4 w-4", read ? "text-muted-foreground" : "text-primary")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", read ? "text-muted-foreground" : "text-foreground")}>
            {title}
          </span>
          {!read && <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
        <span className="text-[11px] text-muted-foreground/70 mt-1 block">{time}</span>
      </div>
    </button>
  );
}
