import { useState, useCallback } from "react";
import { Check, X, ShieldAlert } from "lucide-react";

interface BatchRequest {
  tool: string;
  args: Record<string, unknown>;
  decision: {
    action: string;
    reason: string;
    risk: string;
  };
}

interface BatchApprovalPanelProps {
  id: string;
  requests: BatchRequest[];
  onResolved?: () => void;
}

/**
 * BatchApprovalPanel renders a multi-select approval card for batch tool calls.
 */
export function BatchApprovalPanel({
  id,
  requests,
  onResolved,
}: BatchApprovalPanelProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(requests.map((_, i) => i)),
  );
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const resolve = useCallback(
    async (choice: number, approved?: number[]) => {
      setLoading(true);
      try {
        await fetch(`/api/approve/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice, approved }),
        });
        setResolved(true);
      } finally {
        setLoading(false);
        onResolved?.();
      }
    },
    [id, onResolved],
  );

  if (resolved) {
    return (
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-xs">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
          <Check className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Batch Resolved</span>
          <span className="text-muted-foreground text-sm">
            {requests.length} commands
          </span>
        </div>
      </div>
    );
  }

  return (
    <article className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex w-full flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-base font-semibold leading-tight">
              Approval Required ({requests.length} commands)
            </h2>
            <p className="text-muted-foreground text-sm">
              Select which commands to approve
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-2">
          {requests.map((req, i) => (
            <label
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggle(i)}
                className="size-4 rounded border-input"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {req.tool}
                  </span>
                  {req.decision.risk === "high" && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                      high risk
                    </span>
                  )}
                </div>
                {req.args && (
                  <pre
                    className="text-foreground/80 text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis bg-muted/50 rounded p-1.5 font-mono"
                    title={typeof req.args === "object"
                      ? (req.args as Record<string, unknown>).cmd as string ??
                        (req.args as Record<string, unknown>).path as string ??
                        JSON.stringify(req.args, null, 2)
                      : String(req.args)}
                  >
                    {typeof req.args === "object"
                      ? (req.args as Record<string, unknown>).cmd as string ??
                        (req.args as Record<string, unknown>).path as string ??
                        JSON.stringify(req.args)
                      : String(req.args)}
                  </pre>
                )}
                {req.decision.reason && (
                  <p className="text-muted-foreground text-xs mt-0.5 truncate">
                    {req.decision.reason}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => resolve(0)}
          disabled={loading}
          title="Reject all tool calls"
          className="rounded-full border border-destructive/30 text-destructive px-4 py-2 text-sm hover:bg-destructive/10 transition-colors"
        >
          Deny All
        </button>
        <button
          onClick={() => resolve(1, [...selected])}
          disabled={loading || selected.size === 0}
          title="Allow only the selected tool calls (one-time)"
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Approve Selected ({selected.size})
        </button>
        <button
          onClick={() => resolve(1)}
          disabled={loading}
          title="Allow all tool calls (one-time)"
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Approve All
        </button>
        <button
          onClick={() => resolve(2)}
          disabled={loading}
          title="Allow these tools for the rest of the session (in-memory only)"
          className="rounded-full border border-primary/30 text-primary px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
        >
          Allow Session
        </button>
        <button
          onClick={() => resolve(3)}
          disabled={loading}
          title="Permanently allow these tools (saved to ~/.dmr/approvals.json)"
          className="rounded-full border border-primary/30 text-primary px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
        >
          Always Allow
        </button>
      </div>
    </article>
  );
}
