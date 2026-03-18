import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface CalendarEvent {
  date: number;
  color?: string;
  label?: string;
}

interface CalendarGridProps {
  month?: number; // 0-11
  year?: number;
  events?: CalendarEvent[];
  onPrev?: () => void;
  onNext?: () => void;
  onDateClick?: (date: number) => void;
  className?: string;
}

export function CalendarGrid({
  month: propMonth,
  year: propYear,
  events = [],
  onPrev,
  onNext,
  onDateClick,
  className,
}: CalendarGridProps) {
  const now = new Date();
  const month = propMonth ?? now.getMonth();
  const year = propYear ?? now.getFullYear();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventDates = new Set(events.map((e) => e.date));

  return (
    <div className={cn("glass-card p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <span className="font-display font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const isToday = isCurrentMonth && day === today;
          const hasEvent = eventDates.has(day);

          return (
            <button
              key={day}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "relative h-9 rounded-lg text-sm font-medium transition-all",
                isToday
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {day}
              {hasEvent && !isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
