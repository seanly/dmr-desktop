import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="size-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1.5 py-2">
        <div className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground/50 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">Generating...</span>
      </div>
    </div>
  );
}
