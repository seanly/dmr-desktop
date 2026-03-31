import { Plus, RefreshCw } from "lucide-react";
import { Dialog } from "./Dialog";

type TapeSelectDialogProps = {
  open: boolean;
  onClose: () => void;
  currentTape: string;
  tapes: string[];
  onSelect: (tape: string) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
};

export function TapeSelectDialog({
  open,
  onClose,
  currentTape,
  tapes,
  onSelect,
  onRefresh,
  onCreateNew,
}: TapeSelectDialogProps) {
  const handleSelect = (tape: string) => {
    onSelect(tape);
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    onCreateNew();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Select Tape">
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentTape}</span>
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            title="Refresh tape list"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        </div>

        <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-md border border-border">
          {tapes.map((tape) => (
            <button
              key={tape}
              type="button"
              onClick={() => handleSelect(tape)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                tape === currentTape ? "bg-muted font-medium text-foreground" : "text-foreground"
              }`}
            >
              {tape}
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
        Create New Tape
      </button>
    </Dialog>
  );
}
