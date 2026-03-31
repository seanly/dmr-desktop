import type { DmrConfig } from "../../types/config";

interface BasicSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function BasicSettings({ config, onChange }: BasicSettingsProps) {
  const handleVerboseChange = (value: number) => {
    onChange({ ...config, verbose: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Verbose Level
              <span className="text-muted-foreground ml-2">(0=quiet, 1=info, 2=debug, 3=trace)</span>
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={config.verbose}
              onChange={(e) => handleVerboseChange(parseInt(e.target.value) || 0)}
              className="w-32 rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
