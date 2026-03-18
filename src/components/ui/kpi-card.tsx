import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { forwardRef } from "react";

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

export const KpiCard = forwardRef<HTMLDivElement, KpiCardProps>(
  ({ title, value, subtitle, icon: Icon, trend, trendValue, className }, ref) => {
    const TrendIcon = trend ? trendConfig[trend].icon : null;

    return (
      <div ref={ref} className={cn("glass-card p-5 sm:p-6", className)}>
        <div className="flex items-start justify-between mb-2.5">
          <span className="text-[13px] font-medium text-muted-foreground leading-tight">{title}</span>
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/8">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</span>
          {trend && trendValue && TrendIcon && (
            <span className={cn("flex items-center gap-0.5 text-xs font-medium mb-0.5", trendConfig[trend].color)}>
              <TrendIcon className="h-3 w-3" />
              {trendValue}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    );
  }
);

KpiCard.displayName = "KpiCard";
