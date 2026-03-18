import { cn } from "@/lib/utils";
import { Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatLayoutProps {
  messages: ChatMessage[];
  onSend?: (message: string) => void;
  placeholder?: string;
  emptyContent?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function ChatLayout({
  messages,
  onSend,
  placeholder = "Digite sua mensagem...",
  emptyContent,
  loading = false,
  className,
}: ChatLayoutProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput("");
  };

  return (
    <div className={cn("flex flex-col h-[600px] glass-card overflow-hidden", className)}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && emptyContent ? (
          <div className="flex items-center justify-center h-full">{emptyContent}</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3 max-w-[80%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
            >
              <div className={cn(
                "p-2 rounded-lg shrink-0 h-fit",
                msg.role === "user" ? "bg-primary/10" : "bg-muted"
              )}>
                {msg.role === "user"
                  ? <User className="h-4 w-4 text-primary" />
                  : <Bot className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}>
                {msg.content}
                {msg.timestamp && (
                  <span className={cn(
                    "block text-[10px] mt-1",
                    msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {msg.timestamp}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-muted"><Bot className="h-4 w-4 text-muted-foreground" /></div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary/40 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
