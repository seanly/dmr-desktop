import { Bot, ChevronDown, Anchor, RefreshCw, Settings, Sun, Moon } from "lucide-react";
import type { Message, TapeAnchorRow } from "../../types/chat";
import { TopOutlineMenu } from "./TopOutlineMenu";
import { UserMenu } from "./UserMenu";
import { useTheme } from "../../hooks/useTheme";
import type { RefObject } from "react";

type Props = {
  tapeName: string;
  onTapeClick: () => void;
  historyAfterEntryId: number | null;
  onAnchorClick: () => void;
  anchors: TapeAnchorRow[];
  isEmpty: boolean;
  browsePrefixLength: number;
  loadedHistoryCount: number;
  hasSession: boolean;
  showLanding: boolean;
  messages: Message[];
  scrollRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  authEnabled: boolean;
  user: string | null;
  onLogout: () => void;
  onSettingsClick: () => void;
};

export function ChatHeader({
  tapeName,
  onTapeClick,
  historyAfterEntryId,
  onAnchorClick,
  anchors,
  isEmpty,
  browsePrefixLength,
  loadedHistoryCount,
  hasSession,
  showLanding,
  messages,
  scrollRef,
  inputRef,
  authEnabled,
  user,
  onLogout,
  onSettingsClick,
}: Props) {
  const currentAnchor = anchors.find((a) => a.entry_id === historyAfterEntryId);
  const anchorLabel = historyAfterEntryId
    ? currentAnchor
      ? `#${currentAnchor.entry_id} · ${currentAnchor.name || "(unnamed)"}`
      : `#${historyAfterEntryId}`
    : "Default";

  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");

  return (
    <header className="border-b border-border/60 px-4 sm:px-5 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Bot className="size-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-semibold shrink-0">DMR</h1>
          </div>
          <div className="hidden sm:block h-6 w-px bg-border/80 shrink-0" aria-hidden />
          <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
            <label className="text-muted-foreground shrink-0">Tape</label>
            <button
              type="button"
              onClick={onTapeClick}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted max-w-[200px] sm:max-w-xs"
              title="Select tape"
            >
              <span className="truncate">{tapeName}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
            <label className="text-muted-foreground shrink-0 inline-flex items-center gap-1">
              <Anchor className="size-3.5" />
              Anchor
            </label>
            <button
              type="button"
              onClick={onAnchorClick}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted max-w-[220px] sm:max-w-md"
              title="Select anchor"
            >
              <span className="truncate">{anchorLabel}</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted"
            title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolved === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onSettingsClick}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted"
            title="Settings"
          >
            <Settings className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:bg-muted"
            title="刷新页面"
          >
            <RefreshCw className="size-4" />
          </button>
          <TopOutlineMenu
            isEmpty={isEmpty}
            browsePrefixLength={browsePrefixLength}
            loadedHistoryCount={loadedHistoryCount}
            hasSession={hasSession}
            showLanding={showLanding}
            messages={messages}
            scrollRef={scrollRef}
            inputRef={inputRef}
          />
          {authEnabled && user && <UserMenu username={user} onLogout={onLogout} />}
        </div>
      </div>
    </header>
  );
}
