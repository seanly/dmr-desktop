import { X } from "lucide-react";

interface RestartDialogProps {
  open: boolean;
  status: "restarting" | "waiting" | "success" | "error";
  message: string;
  onClose: () => void;
}

export default function RestartDialog({ open, status, message, onClose }: RestartDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-background rounded-lg border border-border p-6 w-96 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Restarting DMR</h2>
          {status === "success" || status === "error" ? (
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          {/* Progress indicator */}
          {status === "restarting" || status === "waiting" ? (
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: status === "restarting" ? "50%" : "75%" }} />
              </div>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          ) : null}

          {/* Success */}
          {status === "success" ? (
            <div className="text-center space-y-2">
              <div className="text-4xl">✓</div>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          ) : null}

          {/* Error */}
          {status === "error" ? (
            <div className="text-center space-y-2">
              <div className="text-4xl text-destructive">✗</div>
              <p className="text-sm text-destructive">{message}</p>
            </div>
          ) : null}
        </div>

        {status === "success" || status === "error" ? (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
