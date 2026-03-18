import { cn } from "@/lib/utils";
import { Upload, FileIcon, X } from "lucide-react";
import { useRef, useState, DragEvent } from "react";

interface UploadAreaProps {
  label?: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  className?: string;
}

export function UploadArea({
  label = "Arraste arquivos aqui",
  description = "ou clique para selecionar",
  accept,
  multiple = false,
  onFiles,
  className,
}: UploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    setFiles(arr);
    onFiles?.(arr);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFiles?.(updated);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        )}
      >
        <Upload className={cn("h-8 w-8", dragging ? "text-primary" : "text-muted-foreground")} />
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 rounded hover:bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
