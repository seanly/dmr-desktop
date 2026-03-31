import { Send, Square } from "lucide-react";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import type { RefObject, KeyboardEvent } from "react";

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  loading: boolean;
  onSend: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatComposer({ input, onInputChange, onKeyDown, loading, onSend, inputRef }: Props) {
  return (
    <footer
      id="dmr-section-composer"
      className="mx-auto w-full max-w-full shrink-0 scroll-mt-4 px-5 pb-4 pt-2 sm:max-w-[768px] sm:min-w-[400px]"
    >
      <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card shadow-sm px-3 py-2">
        <div className="flex-1 min-w-0">
          <AutoResizeTextarea
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={loading}
            inputRef={inputRef}
          />
        </div>
        {loading ? (
          <button
            type="button"
            title="停止（尚未实现）"
            onClick={() => {
              /* TODO: abort support */
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Square className="size-3.5" fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            title="发送消息"
            onClick={onSend}
            disabled={!input.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-center text-xs text-muted-foreground/50">Enter to send, Shift+Enter for new line</p>
    </footer>
  );
}
