import { useState, type FormEvent } from "react";
import { Dialog } from "./Dialog";

type CreateTapeDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function CreateTapeDialog({ open, onClose, onSubmit }: CreateTapeDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tape name cannot be empty");
      return;
    }
    onSubmit(trimmed);
    setName("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Create New Tape">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tape-name" className="mb-2 block text-sm font-medium text-foreground">
            Tape Name
          </label>
          <input
            id="tape-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter tape name"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
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
