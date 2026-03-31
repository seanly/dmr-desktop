import { EyeOff, Send, Square } from "lucide-react";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import type { RefObject, KeyboardEvent } from "react";

type Props = {
  input: string;
  onInputChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  loading: boolean;
  onSend: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  readOnly?: boolean;
  hasPendingApproval?: boolean;
};

export function ChatComposer({ input, onInputChange, onKeyDown, loading, onSend, inputRef, readOnly, hasPendingApproval }: Props) {
  const canSendApproval = hasPendingApproval && !readOnly;
  const isDisabled = (loading && !canSendApproval) || !!readOnly;

  if (readOnly) {
    return (
      <footer
        id="dmr-section-composer"
        className="mx-auto w-full max-w-full shrink-0 scroll-mt-4 px-5 pb-4 pt-2 sm:max-w-[768px] sm:min-w-[400px]"
      >
        <div className="flex items-center justify-center rounded-2xl border border-border/40 bg-muted/50 px-3 py-3">
          <p className="text-sm text-muted-foreground">
            <EyeOff className="mr-1.5 inline-block size-4 align-text-bottom" />
            只读模式 — 仅 web / web:* 前缀的 tape 支持输入
          </p>
        </div>
      </footer>
    );
  }

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
            disabled={isDisabled}
            inputRef={inputRef}
          />
        </div>
        {loading && !canSendApproval ? (
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
            disabled={!input.trim() || isDisabled}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
      {canSendApproval ? (
        <p className="mt-1.5 text-center text-xs text-amber-600/80">Pending approval — reply with y / s / a / n</p>
      ) : (
        <p className="mt-1.5 text-center text-xs text-muted-foreground/50">Enter to send, Shift+Enter for new line</p>
      )}
    </footer>
  );
}
