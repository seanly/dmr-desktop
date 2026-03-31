import { AlertCircle } from "lucide-react";
import { Dialog } from "./Dialog";

type ErrorDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
};

export function ErrorDialog({ open, onClose, title = "Error", message }: ErrorDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="mb-4 flex items-start gap-3">
        <AlertCircle className="size-5 shrink-0 text-red-500" />
        <p className="text-sm text-foreground">{message}</p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          OK
        </button>
      </div>
    </Dialog>
  );
}
