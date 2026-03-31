import { useState } from "react";
import { Wrench, ChevronDown, ChevronRight } from "lucide-react";
import type { ToolCall } from "../../types/chat";
import { extractSummary } from "../../lib/chatUtils";

export function ToolCallCard({ tc }: { tc: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const truncatedResult = tc.result.length > 300 ? tc.result.slice(0, 300) + "..." : tc.result;
  const summary = extractSummary(tc.name, tc.arguments);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <Wrench className="size-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground shrink-0">{tc.name}</span>
        {summary && <code className="text-muted-foreground truncate font-mono">{summary}</code>}
        {expanded ? (
          <ChevronDown className="size-3 text-muted-foreground ml-auto shrink-0" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground ml-auto shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/40 px-3 py-2 space-y-2">
          {tc.arguments && (
            <div>
              <div className="text-muted-foreground mb-0.5">Arguments</div>
              <pre className="whitespace-pre-wrap break-all text-foreground/80 bg-muted/50 rounded p-1.5">{tc.arguments}</pre>
            </div>
          )}
          {tc.result && (
            <div>
              <div className="text-muted-foreground mb-0.5">Result</div>
              <pre className="whitespace-pre-wrap break-all text-foreground/80 bg-muted/50 rounded p-1.5 max-h-[200px] overflow-y-auto">
                {truncatedResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
