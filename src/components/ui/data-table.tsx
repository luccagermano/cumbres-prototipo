import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";

export interface DataColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado.",
  compact = false,
  className,
}: DataTableProps<T>) {
  const cellPadding = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPadding,
                    "text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && <ChevronsUpDown className="h-3 w-3 opacity-30" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border/40 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-primary/[0.02]",
                    i % 2 === 1 && "bg-muted/15"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn(cellPadding, "text-sm text-foreground", col.className)}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
