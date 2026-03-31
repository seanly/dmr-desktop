import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { DmrConfig, PluginConfig } from "../../types/config";
import CollapsibleSection from "./CollapsibleSection";

interface PluginsSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function PluginsSettings({ config, onChange }: PluginsSettingsProps) {
  const [editingConfigs, setEditingConfigs] = useState<Record<number, string>>({});

  const togglePlugin = (index: number) => {
    const newPlugins = [...config.plugins];
    newPlugins[index] = { ...newPlugins[index], enabled: !newPlugins[index].enabled };
    onChange({ ...config, plugins: newPlugins });
  };

  const getConfigText = (index: number) => {
    if (editingConfigs[index] !== undefined) {
      return editingConfigs[index];
    }
    const plugin = config.plugins[index];
    return plugin.config ? JSON.stringify(plugin.config, null, 2) : "";
  };

  const handleConfigChange = (index: number, text: string) => {
    setEditingConfigs({ ...editingConfigs, [index]: text });
  };

  const handleConfigBlur = (index: number) => {
    const text = editingConfigs[index];
    if (text === undefined) return;

    const newPlugins = [...config.plugins];
    try {
      const configObj = text.trim() ? JSON.parse(text) : undefined;
      newPlugins[index] = { ...newPlugins[index], config: configObj };
      onChange({ ...config, plugins: newPlugins });
      // 清除编辑状态
      const newEditingConfigs = { ...editingConfigs };
      delete newEditingConfigs[index];
      setEditingConfigs(newEditingConfigs);
    } catch (e) {
      console.error("Invalid JSON:", e);
      alert("Invalid JSON format. Please fix the syntax.");
    }
  };

  const builtinPlugins = config.plugins.filter((p) => !p.path);

  const addPlugin = () => {
    const newPlugin: PluginConfig = {
      name: "custom-builtin",
      enabled: true,
    };
    onChange({ ...config, plugins: [...config.plugins, newPlugin] });
  };

  const removePlugin = (index: number) => {
    const newPlugins = config.plugins.filter((_, i) => i !== index);
    onChange({ ...config, plugins: newPlugins });
  };

  const updatePluginName = (index: number, name: string) => {
    const newPlugins = [...config.plugins];
    newPlugins[index] = { ...newPlugins[index], name };
    onChange({ ...config, plugins: newPlugins });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Built-in Plugins</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable built-in plugins. Some plugins are dangerous and disabled by default.
          </p>
        </div>
        <button
          onClick={addPlugin}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Plugin
        </button>
      </div>

      <div className="space-y-2">
          {builtinPlugins.map((plugin, index) => {
            const actualIndex = config.plugins.findIndex((p) => p.name === plugin.name);
            const isDangerous = ["shell", "powershell", "fs", "subagent"].includes(plugin.name);

            return (
              <CollapsibleSection
                key={plugin.name}
                title={plugin.name}
                subtitle={getPluginDescription(plugin.name)}
                badge={
                  isDangerous && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      DANGEROUS
                    </span>
                  )
                }
                actions={
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={() => togglePlugin(actualIndex)}
                        className="rounded"
                      />
                      <span className="text-sm">Enabled</span>
                    </label>
                    <button
                      onClick={() => removePlugin(actualIndex)}
                      className="rounded-md p-1 hover:bg-destructive/10 text-destructive"
                      title="Remove plugin"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plugin Name</label>
                    <input
                      type="text"
                      value={plugin.name}
                      onChange={(e) => updatePluginName(actualIndex, e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="plugin-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Config (JSON)
                    </label>
                  <textarea
                    value={getConfigText(actualIndex)}
                    onChange={(e) => handleConfigChange(actualIndex, e.target.value)}
                    onBlur={() => handleConfigBlur(actualIndex)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                    rows={4}
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>
            </CollapsibleSection>
          );
        })}
      </div>
    </div>
  );
}

function getPluginDescription(name: string): string {
  const descriptions: Record<string, string> = {
    command: "Intercepts comma-prefixed input for special commands",
    opa_policy: "Evaluates tool calls for safety using OPA policies",
    cli: "Provides chat interface and approval prompts",
    shell: "Execute shell commands (DANGEROUS - disabled by default)",
    powershell: "Execute PowerShell commands on Windows (DANGEROUS)",
    fs: "File system operations (DANGEROUS - disabled by default)",
    tape: "Search conversation history",
    subagent: "Spawn sub-agents (disabled by default)",
    skill: "Load skills from SKILL.md files",
    webtool: "HTTP fetch and DuckDuckGo search",
    mcp: "MCP server bridge",
    osinfo: "Inject OS/platform info into system prompt",
  };
  return descriptions[name] || "No description available";
}
