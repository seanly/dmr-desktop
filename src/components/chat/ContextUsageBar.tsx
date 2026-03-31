import type { ContextUsage } from "../../lib/chatUtils";

export function ContextUsageBar({ contextUsage }: { contextUsage: ContextUsage }) {
  const { promptTokens, completionTokens, contextBudget } = contextUsage;

  const percent = contextBudget > 0 ? Math.min(100, (promptTokens / contextBudget) * 100) : 0;
  const showBudget = contextBudget > 0 && !Number.isNaN(contextBudget);

  return (
    <div className="px-4 sm:px-5 py-2 border-b border-border/60">
      <div className="flex items-center justify-between gap-3 text-[11px] leading-none text-muted-foreground">
        <div className="whitespace-nowrap">
          LLM window: <span className="text-foreground/85 font-semibold">{promptTokens}</span>
          {showBudget ? (
            <span>
              /{contextBudget} tokens ({Math.round(percent)}%)
            </span>
          ) : (
            <span> tokens</span>
          )}
        </div>
        <div className="whitespace-nowrap">
          completion: <span className="text-foreground/85 font-semibold">{completionTokens}</span>
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full rounded bg-muted/40 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={contextBudget > 0 ? contextBudget : 100} aria-valuenow={promptTokens}>
        {showBudget ? (
          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        ) : (
          // Budget unknown: show a subtle static bar.
          <div className="h-full bg-primary/30" style={{ width: `${Math.min(5, promptTokens)}%` }} />
        )}
      </div>
    </div>
  );
}

