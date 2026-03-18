import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ChipFilterOption {
  label: string;
  value: string;
  count?: number;
}

interface ChipFilterProps {
  options: ChipFilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function ChipFilter({ options, selected, onChange, className }: ChipFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn(
                "px-1 py-0.5 rounded text-[10px] leading-none",
                isSelected ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {opt.count}
              </span>
            )}
            {isSelected && <X className="h-3 w-3 ml-0.5 opacity-70" />}
          </button>
        );
      })}
    </div>
  );
}
