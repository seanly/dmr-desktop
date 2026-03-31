import { Bot } from "lucide-react";
import { Markdown } from "../Markdown";
import type { Message } from "../../types/chat";
import { ToolCallCard } from "./ToolCallCard";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
        <Bot className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {message.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} tc={tc} />
            ))}
          </div>
        )}
        <div className="text-sm text-foreground leading-relaxed">
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
