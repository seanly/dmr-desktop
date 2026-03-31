import { Bot } from "lucide-react";
import type { Message } from "../../types/chat";
import { TapeSingleWindowHint, TapeDualWindowHint } from "./TapeHints";
import { BrowseSegmentLabel, BrowseToLiveContextDivider, NewMessagesLandingZone } from "./TapeSegments";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { RefObject } from "react";

type Props = {
  scrollRef: RefObject<HTMLDivElement | null>;
  isEmpty: boolean;
  loading: boolean;
  messages: Message[];
  tapeName: string;
  historyAfterEntryId: number | null;
  loadedHistoryCount: number;
  browsePrefixLength: number;
  anchorWindowLabel: string;
};

export function ChatMessageList({
  scrollRef,
  isEmpty,
  loading,
  messages,
  tapeName,
  historyAfterEntryId,
  loadedHistoryCount,
  browsePrefixLength,
  anchorWindowLabel,
}: Props) {
  return (
    <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-full flex-col px-5 sm:min-w-[400px] sm:max-w-[768px]">
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Bot className="size-6 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground">How can I help?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Send a message to start a conversation</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-6 py-6">
            {!isEmpty &&
              !(loadedHistoryCount > 0 && messages.length > 0 && messages.length === loadedHistoryCount) && (
                <div id="dmr-section-top" className="h-px w-full shrink-0 scroll-mt-4 opacity-0" aria-hidden />
              )}
            {loadedHistoryCount > 0 && messages.length > 0 && messages.length === loadedHistoryCount && (
              <div id="dmr-section-top">
                {historyAfterEntryId != null && historyAfterEntryId > 0 && !Number.isNaN(historyAfterEntryId) ? (
                  <TapeDualWindowHint fromLabel={anchorWindowLabel} />
                ) : (
                  <TapeSingleWindowHint anchorLabel={anchorWindowLabel} />
                )}
              </div>
            )}
            {browsePrefixLength > 0 && <BrowseSegmentLabel fromLabel={anchorWindowLabel} id="dmr-section-from" />}
            {messages.slice(0, browsePrefixLength).map((m, i) => (
              <div key={`browse-${tapeName}-${historyAfterEntryId ?? "d"}-${i}`} id={`dmr-outline-${i}`} className="scroll-mt-4">
                <MessageBubble message={m} />
              </div>
            ))}
            {browsePrefixLength > 0 && loadedHistoryCount > browsePrefixLength && (
              <BrowseToLiveContextDivider id="dmr-section-live" />
            )}
            {browsePrefixLength === 0 && loadedHistoryCount > 0 && (
              <div id="dmr-section-live" className="h-px w-full shrink-0 scroll-mt-4 opacity-0" aria-hidden />
            )}
            {messages.slice(browsePrefixLength, loadedHistoryCount).map((m, i) => {
              const idx = browsePrefixLength + i;
              return (
                <div key={`live-${tapeName}-${i}`} id={`dmr-outline-${idx}`} className="scroll-mt-4">
                  <MessageBubble message={m} />
                </div>
              );
            })}
            {loadedHistoryCount > 0 && messages.length > 0 && messages.length === loadedHistoryCount && !loading && (
              <NewMessagesLandingZone id="dmr-section-landing" />
            )}
            {messages.slice(loadedHistoryCount).map((m, i) => {
              const idx = loadedHistoryCount + i;
              return (
                <div key={`sess-${i}`} id={`dmr-outline-${idx}`} className="scroll-mt-4">
                  <MessageBubble message={m} />
                </div>
              );
            })}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>
    </main>
  );
}
