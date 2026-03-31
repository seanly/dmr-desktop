import { useState, useRef, useCallback, useEffect, useMemo, type RefObject } from "react";
import { List } from "lucide-react";
import type { Message } from "../../types/chat";
import { scrollToSection, buildUserOutlineEntries } from "../../lib/chatUtils";

type Props = {
  isEmpty: boolean;
  browsePrefixLength: number;
  loadedHistoryCount: number;
  hasSession: boolean;
  showLanding: boolean;
  messages: Message[];
  scrollRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

/** Header dropdown: jump to sections and user messages (picoclaw-style outline). */
export function TopOutlineMenu({
  isEmpty,
  browsePrefixLength,
  loadedHistoryCount,
  hasSession,
  showLanding,
  messages,
  scrollRef,
  inputRef,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userEntries = useMemo(() => buildUserOutlineEntries(messages), [messages]);

  const jumpComposer = useCallback(() => {
    setOpen(false);
    const main = scrollRef.current;
    if (main) main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
    window.setTimeout(() => inputRef.current?.focus(), 280);
  }, [scrollRef, inputRef]);

  const jumpSection = useCallback((id: string) => {
    scrollToSection(id);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const jumpUserMessage = useCallback((index: number) => {
    document.getElementById(`dmr-outline-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      history.replaceState(null, "", `#dmr-outline-${index}`);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const jumpSessionStart = useCallback(() => {
    document.getElementById(`dmr-outline-${loadedHistoryCount}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      history.replaceState(null, "", `#dmr-outline-${loadedHistoryCount}`);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [loadedHistoryCount]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const hasLive =
    loadedHistoryCount > browsePrefixLength || (browsePrefixLength === 0 && loadedHistoryCount > 0);
  const showFrom = browsePrefixLength > 0;

  const sectionBtn = (id: string, label: string, disabled: boolean) => (
    <button
      key={id}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && jumpSection(id)}
      className="w-full rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      <span className="font-mono text-muted-foreground">#</span> {label}
    </button>
  );

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="对话大纲：区块与用户输入"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground hover:bg-muted/50"
      >
        <List className="size-4 shrink-0 text-muted-foreground" />
        大纲
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-1 max-h-[min(60vh,420px)] w-[min(100vw-2rem,20rem)] overflow-y-auto rounded-lg border border-border/80 bg-card py-2 shadow-lg"
          role="region"
          aria-label="对话大纲"
        >
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">页面区块</div>
          <div className="px-1">
            {sectionBtn("dmr-section-top", "顶部", isEmpty)}
            {sectionBtn("dmr-section-from", "Selected anchor", !showFrom)}
            {sectionBtn("dmr-section-live", "After last anchor", !hasLive)}
            {sectionBtn("dmr-section-landing", "新消息区", !showLanding)}
            <button
              key="session"
              type="button"
              disabled={!hasSession}
              onClick={() => hasSession && jumpSessionStart()}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <span className="font-mono text-muted-foreground">#</span> 本页新消息
            </button>
          </div>
          <div className="mx-2 my-2 border-t border-border/60" />
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">用户输入</div>
          {userEntries.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">{isEmpty ? "暂无对话" : "暂无用户消息"}</div>
          ) : (
            <ul className="flex flex-col px-1">
              {userEntries.map(({ index, label, ordinal }) => (
                <li key={index}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => jumpUserMessage(index)}
                  >
                    <span className="mr-1.5 font-mono text-xs font-medium text-primary">#{ordinal}</span>
                    <span className="line-clamp-2 break-words">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mx-2 my-2 border-t border-border/60" />
          <div className="px-1">
            <button
              type="button"
              onClick={jumpComposer}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted/80"
            >
              <span className="font-mono text-muted-foreground">#</span> 输入框（滚到底并聚焦）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
