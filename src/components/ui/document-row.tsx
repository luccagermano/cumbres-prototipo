import { cn } from "@/lib/utils";
import { FileText, ChevronRight, Download } from "lucide-react";
import { StatusChip } from "./status-chip";

interface DocumentRowProps {
  title: string;
  category?: string;
  date?: string;
  status?: { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" | "pending" };
  onClick?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function DocumentRow({ title, category, date, status, onClick, onDownload, className }: DocumentRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border border-border bg-card transition-all",
        onClick && "cursor-pointer hover:bg-muted/50 hover:border-primary/20",
        className
      )}
    >
      <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
        <FileText className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground block truncate">{title}</span>
        <div className="flex items-center gap-2 mt-0.5">
          {category && <span className="text-xs text-muted-foreground">{category}</span>}
          {category && date && <span className="text-muted-foreground/40">·</span>}
          {date && <span className="text-xs text-muted-foreground">{date}</span>}
        </div>
      </div>

      {status && <StatusChip label={status.label} variant={status.variant} size="sm" />}

      {onDownload && (
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </div>
  );
}
