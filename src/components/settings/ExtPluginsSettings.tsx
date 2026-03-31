import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PluginConfig, DmrConfig } from "../../types/config";
import CollapsibleSection from "./CollapsibleSection";

interface ExtPluginsSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function ExtPluginsSettings({ config, onChange }: ExtPluginsSettingsProps) {
  const [editingConfigs, setEditingConfigs] = useState<Record<number, string>>({});
  const externalPlugins = config.plugins.filter((p) => p.path !== undefined);

  const addPlugin = () => {
    const newPlugin: PluginConfig = {
      name: "custom-plugin",
      enabled: true,
      path: "",
    };
    onChange({ ...config, plugins: [...config.plugins, newPlugin] });
  };

  const removePlugin = (index: number) => {
    const newPlugins = config.plugins.filter((_, i) => i !== index);
    onChange({ ...config, plugins: newPlugins });
  };

  const updatePlugin = (index: number, field: keyof PluginConfig, value: any) => {
    const newPlugins = [...config.plugins];
    newPlugins[index] = { ...newPlugins[index], [field]: value };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">External Plugins</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Load custom plugins from external paths
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

      <div className="space-y-4">
        {externalPlugins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No external plugins configured
          </div>
        ) : (
          externalPlugins.map((plugin) => {
            const actualIndex = config.plugins.findIndex((p) => p === plugin);
            return (
              <CollapsibleSection
                key={actualIndex}
                title={plugin.name}
                subtitle={plugin.path || "No path specified"}
                actions={
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={(e) => updatePlugin(actualIndex, "enabled", e.target.checked)}
                        className="rounded"
                      />
                      Enabled
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
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={plugin.name}
                      onChange={(e) => updatePlugin(actualIndex, "name", e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Plugin name"
                    />
                  </div>
                  <label className="block text-sm font-medium mb-1">Path</label>
                  <input
                    type="text"
                    value={plugin.path || ""}
                    onChange={(e) => updatePlugin(actualIndex, "path", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="/path/to/plugin.so"
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
              </CollapsibleSection>
            );
          })
        )}
      </div>
    </div>
  );
}
