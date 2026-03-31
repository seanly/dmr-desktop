import { useState, type FormEvent } from "react";
import { Dialog } from "./Dialog";

type CreateHandoffDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  suggestedName?: string;
};

export function CreateHandoffDialog({ open, onClose, onSubmit, suggestedName = "" }: CreateHandoffDialogProps) {
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Anchor name cannot be empty");
      return;
    }
    onSubmit(trimmed);
    setName("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName(suggestedName);
    setError("");
    onClose();
  };

  // Update name when suggestedName changes
  if (open && name === "" && suggestedName) {
    setName(suggestedName);
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create Handoff Anchor">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="anchor-name" className="mb-2 block text-sm font-medium text-foreground">
            Anchor Name
          </label>
          <input
            id="anchor-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter anchor name"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            This anchor will be appended to the current tape
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create
          </button>
        </div>
      </form>
    </Dialog>
  );
}
