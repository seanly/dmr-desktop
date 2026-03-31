import type { DmrConfig } from "../../types/config";

interface AgentSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function AgentSettings({ config, onChange }: AgentSettingsProps) {
  const updateAgent = (field: keyof typeof config.agent, value: any) => {
    onChange({
      ...config,
      agent: { ...config.agent, [field]: value },
    });
  };

  const systemPromptText = config.agent.system_prompt?.join("\n") || "";

  const handleSystemPromptChange = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    updateAgent("system_prompt", lines.length > 0 ? lines : null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Steps</label>
            <input
              type="number"
              value={config.agent.max_steps}
              onChange={(e) => updateAgent("max_steps", parseInt(e.target.value) || 20)}
              className="w-32 rounded-md border border-border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Token (Context Budget)</label>
            <input
              type="number"
              value={config.agent.max_token || ""}
              onChange={(e) => updateAgent("max_token", parseInt(e.target.value) || undefined)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
              placeholder="200000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Handoff Threshold</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.agent.handoff_threshold || ""}
              onChange={(e) => updateAgent("handoff_threshold", parseFloat(e.target.value) || undefined)}
              className="w-32 rounded-md border border-border bg-background px-3 py-2"
              placeholder="0.8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              System Prompt Files
              <span className="text-muted-foreground ml-2">(one per line, e.g., ./AGENTS.md)</span>
            </label>
            <textarea
              value={systemPromptText}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
              rows={4}
              placeholder="./AGENTS.md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
