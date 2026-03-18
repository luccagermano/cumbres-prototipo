import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { StatusChip } from "./status-chip";

interface TicketRowProps {
  id: string;
  title: string;
  status: { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" | "pending" };
  date?: string;
  assignee?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function TicketRow({ id, title, status, date, assignee, icon: Icon, onClick, className }: TicketRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border border-border bg-card transition-all",
        onClick && "cursor-pointer hover:bg-muted/50 hover:border-primary/20",
        className
      )}
    >
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">#{id}</span>
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {assignee && <span className="text-xs text-muted-foreground">{assignee}</span>}
          {assignee && date && <span className="text-muted-foreground/40">·</span>}
          {date && <span className="text-xs text-muted-foreground">{date}</span>}
        </div>
      </div>

      <StatusChip label={status.label} variant={status.variant} size="sm" />
      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </div>
  );
}
