import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = "Buscar...", value, onChange, className }: SearchBarProps) {
  const [internal, setInternal] = useState(value ?? "");
  const currentValue = value ?? internal;
  const handleChange = (v: string) => {
    setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
      <input
        type="text"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-9 py-2 rounded-lg border border-border bg-card/80 text-sm text-foreground",
          "placeholder:text-muted-foreground/50",
          "focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30",
          "transition-all duration-200"
        )}
      />
      {currentValue && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
