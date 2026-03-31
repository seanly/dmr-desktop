import { useState, useEffect, useCallback, useRef } from "react";

/** Approval event from the server SSE stream. */
export interface ApprovalEvent {
  id: string;
  type: "single" | "batch";
  tool: string;
  args: Record<string, unknown>;
  decision: {
    action: string;
    reason: string;
    risk: string;
  };
  requests?: ApprovalEventItem[];
}

export interface ApprovalEventItem {
  tool: string;
  args: Record<string, unknown>;
  decision: {
    action: string;
    reason: string;
    risk: string;
  };
}

/** Resolve request sent back to the server. */
export interface ResolveRequest {
  choice: number; // 0=Denied, 1=ApprovedOnce, 2=ApprovedSession, 3=ApprovedAlways
  comment?: string;
  approved?: number[]; // for batch: specific indices
}

/**
 * useApprovalStream connects to the /api/approvals SSE endpoint
 * and provides pending approval events + a resolve function.
 */
export function useApprovalStream() {
  const [pending, setPending] = useState<ApprovalEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/approvals");
    eventSourceRef.current = es;

    es.addEventListener("approval", (e) => {
      const event: ApprovalEvent = JSON.parse(e.data);
      setPending((prev) => [...prev, event]);
    });

    es.addEventListener("error", () => {
      // Auto-reconnect is built into EventSource
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  const resolve = useCallback(async (id: string, req: ResolveRequest) => {
    const resp = await fetch(`/api/approve/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (resp.ok) {
      setPending((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setPending((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { pending, resolve, dismiss };
}
