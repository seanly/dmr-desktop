import { useState, useCallback } from "react";
import { Check, X, Shield, ShieldAlert } from "lucide-react";

interface ApprovalPanelProps {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
  reason?: string;
  risk?: string;
  choice?: "approved" | "denied";
  onResolved?: (choice: number) => void;
}

/**
 * ApprovalPanel renders an approval card for a single tool call.
 * Inspired by tool-ui's ApprovalCard but self-contained.
 */
export function ApprovalPanel({
  id,
  tool,
  args,
  reason,
  risk,
  choice: initialChoice,
  onResolved,
}: ApprovalPanelProps) {
  const [choice, setChoice] = useState<"approved" | "denied" | undefined>(
    initialChoice,
  );
  const [loading, setLoading] = useState(false);

  const resolve = useCallback(
    async (approvalChoice: number) => {
      setLoading(true);
      try {
        await fetch(`/api/approve/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice: approvalChoice }),
        });
        setChoice(approvalChoice > 0 ? "approved" : "denied");
      } finally {
        setLoading(false);
        onResolved?.(approvalChoice);
      }
    },
    [id, onResolved],
  );

  const isDestructive = risk === "high";

  // Receipt view (already resolved)
  if (choice) {
    const isApproved = choice === "approved";
    return (
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-xs">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ${
            isApproved ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {isApproved ? (
            <Check className="size-4" />
          ) : (
            <X className="size-4" />
          )}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isApproved ? "Approved" : "Denied"}
          </span>
          <span className="text-muted-foreground text-sm">{tool}</span>
        </div>
      </div>
    );
  }

  // Interactive view
  return (
    <article className="flex w-full max-w-md flex-col gap-3">
      <div className="flex w-full flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              isDestructive
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isDestructive ? (
              <ShieldAlert className="size-5" />
            ) : (
              <Shield className="size-5" />
            )}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-base font-semibold leading-tight">
              Execute: {tool}
            </h2>
            {reason && (
              <p className="text-muted-foreground text-sm">{reason}</p>
            )}
          </div>
        </div>

        {args && Object.keys(args).length > 0 && (
          <>
            <div className="h-px bg-border" />
            <dl className="flex flex-col gap-2 text-sm">
              {Object.entries(args).map(([key, value]) => {
                const text = typeof value === "string" ? value : JSON.stringify(value);
                return (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">{key}</dt>
                    <dd className="min-w-0 truncate font-mono text-xs" title={text}>
                      {text}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => resolve(0)}
          disabled={loading}
          title="Reject this tool call"
          className="rounded-full border border-destructive/30 text-destructive px-4 py-2 text-sm hover:bg-destructive/10 transition-colors"
        >
          Deny
        </button>
        <button
          onClick={() => resolve(1)}
          disabled={loading}
          title="Allow this single execution only"
          className={`rounded-full px-4 py-2 text-sm text-primary-foreground transition-colors ${
            isDestructive
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          Approve Once
        </button>
        <button
          onClick={() => resolve(2)}
          disabled={loading}
          title="Allow this tool for the rest of the session (in-memory only)"
          className="rounded-full border border-primary/30 text-primary px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
        >
          Allow Session
        </button>
        <button
          onClick={() => resolve(3)}
          disabled={loading}
          title="Permanently allow this tool (saved to ~/.dmr/approvals.json)"
          className="rounded-full border border-primary/30 text-primary px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
        >
          Always Allow
        </button>
      </div>
    </article>
  );
}
