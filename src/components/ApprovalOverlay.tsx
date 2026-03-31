import { useApprovalStream } from "@/lib/useApprovalStream";
import { ApprovalPanel } from "./ApprovalPanel";
import { BatchApprovalPanel } from "./BatchApprovalPanel";

/**
 * ApprovalOverlay renders pending approval requests as a floating panel.
 * These come from the /api/approvals SSE stream, independent of the chat thread.
 */
export function ApprovalOverlay() {
  const { pending, resolve, dismiss } = useApprovalStream();

  if (pending.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
        {pending.map((event) => {
        if (event.type === "batch" && event.requests) {
          return (
            <BatchApprovalPanel
              key={event.id}
              id={event.id}
              requests={event.requests}
              onResolved={() => dismiss(event.id)}
            />
          );
        }

        return (
          <ApprovalPanel
            key={event.id}
            id={event.id}
            tool={event.tool}
            args={event.args}
            reason={event.decision.reason}
            risk={event.decision.risk}
            onResolved={() => dismiss(event.id)}
          />
        );
      })}
      </div>
    </div>
  );
}
