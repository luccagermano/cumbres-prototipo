import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: Trend;
  trendValue?: string;
  className?: string;
}

const trendConfig: Record<Trend, { icon: LucideIcon; color: string }> = {
  up: { icon: TrendingUp, color: "text-emerald-600" },
  down: { icon: TrendingDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

export function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: KpiCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-display text-3xl font-bold text-foreground">{value}</span>
        {trend && trendValue && TrendIcon && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium mb-1", trendConfig[trend].color)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
