import type { DmrConfig } from "../../types/config";

interface TapeSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function TapeSettings({ config, onChange }: TapeSettingsProps) {
  const updateTape = (field: keyof typeof config.tape, value: any) => {
    onChange({
      ...config,
      tape: { ...config.tape, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Tape Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Driver</label>
            <select
              value={config.tape.driver}
              onChange={(e) => updateTape("driver", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="mem">Memory</option>
              <option value="file">File</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          {config.tape.driver === "sqlite" && (
            <div>
              <label className="block text-sm font-medium mb-2">DSN (Database Path)</label>
              <input
                type="text"
                value={config.tape.dsn || ""}
                onChange={(e) => updateTape("dsn", e.target.value || undefined)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="~/.dmr/tapes.db"
              />
            </div>
          )}

          {config.tape.driver === "file" && (
            <div>
              <label className="block text-sm font-medium mb-2">Directory</label>
              <input
                type="text"
                value={config.tape.dir || ""}
                onChange={(e) => updateTape("dir", e.target.value || undefined)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                placeholder="~/.dmr/tapes"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
