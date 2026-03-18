import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Page-level skeleton: KPI row + content area */
export function PageSkeleton({ kpiCount = 3, rows = 5 }: { kpiCount?: number; rows?: number }) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-4 w-32 mb-3 skeleton-shimmer" />
        <Skeleton className="h-7 w-56 mb-1.5 skeleton-shimmer" />
        <Skeleton className="h-4 w-72 skeleton-shimmer" />
      </div>

      {/* KPI row */}
      <div className={cn("grid gap-4 mb-8", kpiCount <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-4 w-24 skeleton-shimmer" />
              <Skeleton className="h-8 w-8 rounded-lg skeleton-shimmer" />
            </div>
            <Skeleton className="h-8 w-20 mb-1 skeleton-shimmer" />
            <Skeleton className="h-3 w-16 skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* List rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0 skeleton-shimmer" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48 skeleton-shimmer" />
              <Skeleton className="h-3 w-32 skeleton-shimmer" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Table skeleton for internal pages */
export function TableSkeleton({ cols = 5, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16 skeleton-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className={cn("h-4 skeleton-shimmer", j === 0 ? "w-32" : "w-20")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Card grid skeleton */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <Skeleton className="h-10 w-10 rounded-xl mb-3 skeleton-shimmer" />
          <Skeleton className="h-4 w-28 mb-1.5 skeleton-shimmer" />
          <Skeleton className="h-3 w-40 skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
