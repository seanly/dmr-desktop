import { Plus, RefreshCw } from "lucide-react";
import { Dialog } from "./Dialog";
import type { TapeAnchorRow } from "../types/chat";

type AnchorSelectDialogProps = {
  open: boolean;
  onClose: () => void;
  currentAnchorId: number | null;
  anchors: TapeAnchorRow[];
  onSelect: (entryId: number | null) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
};

export function AnchorSelectDialog({
  open,
  onClose,
  currentAnchorId,
  anchors,
  onSelect,
  onRefresh,
  onCreateNew,
}: AnchorSelectDialogProps) {
  const handleSelect = (entryId: number | null) => {
    onSelect(entryId);
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    onCreateNew();
  };

  const currentAnchor = anchors.find((a) => a.entry_id === currentAnchorId);
  const currentLabel = currentAnchorId
    ? currentAnchor
      ? `#${currentAnchor.entry_id} · ${currentAnchor.name || "(unnamed)"}`
      : `#${currentAnchorId}`
    : "Default (after last anchor)";

  return (
    <Dialog open={open} onClose={onClose} title="Select Anchor">
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentLabel}</span>
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            title="Refresh anchor list"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>

        <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-md border border-border">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
              currentAnchorId === null ? "bg-muted font-medium text-foreground" : "text-foreground"
            }`}
          >
            Default (after last anchor)
          </button>
          {anchors.map((anchor) => (
            <button
              key={anchor.entry_id}
              type="button"
              onClick={() => handleSelect(anchor.entry_id)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                anchor.entry_id === currentAnchorId ? "bg-muted font-medium text-foreground" : "text-foreground"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted-foreground">#{anchor.entry_id}</span>
                <span className="flex-1">{anchor.name || "(unnamed)"}</span>
                {anchor.date && (
                  <span className="text-xs text-muted-foreground">{anchor.date.slice(0, 19)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreateNew}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" />
        Create New Handoff Anchor
      </button>
    </Dialog>
  );
}
