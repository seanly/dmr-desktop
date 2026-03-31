import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ModelConfig, DmrConfig } from "../../types/config";
import CollapsibleSection from "./CollapsibleSection";

interface ModelsSettingsProps {
  config: DmrConfig;
  onChange: (config: DmrConfig) => void;
}

export default function ModelsSettings({ config, onChange }: ModelsSettingsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingExtraConfigs, setEditingExtraConfigs] = useState<Record<number, string>>({});

  // 已知的字段列表
  const knownFields = new Set([
    'name', 'model', 'api_key', 'api_base', 'default',
    'max_token', 'handoff_threshold', 'completion_max_tokens',
    'tool_result_max_chars', 'token_url', 'client_id', 'client_secret'
  ]);

  const getExtraConfig = (model: ModelConfig) => {
    const extra: Record<string, any> = {};
    Object.keys(model).forEach(key => {
      if (!knownFields.has(key)) {
        extra[key] = (model as any)[key];
      }
    });
    return extra;
  };

  const getExtraConfigText = (index: number) => {
    if (editingExtraConfigs[index] !== undefined) {
      return editingExtraConfigs[index];
    }
    const extra = getExtraConfig(config.models[index]);
    return Object.keys(extra).length > 0 ? JSON.stringify(extra, null, 2) : "";
  };

  const handleExtraConfigChange = (index: number, text: string) => {
    setEditingExtraConfigs({ ...editingExtraConfigs, [index]: text });
  };

  const handleExtraConfigBlur = (index: number) => {
    const text = editingExtraConfigs[index];
    if (text === undefined) return;

    const newModels = [...config.models];
    try {
      const extraObj = text.trim() ? JSON.parse(text) : {};
      // 合并额外配置到模型对象
      newModels[index] = { ...newModels[index], ...extraObj };
      onChange({ ...config, models: newModels });
      // 清除编辑状态
      const newEditingConfigs = { ...editingExtraConfigs };
      delete newEditingConfigs[index];
      setEditingExtraConfigs(newEditingConfigs);
    } catch (e) {
      console.error("Invalid JSON:", e);
      alert("Invalid JSON format. Please fix the syntax.");
    }
  };

  const addModel = () => {
    const newModel: ModelConfig = {
      name: "new-model",
      model: "claude-opus-4-6",
      api_key: "",
      api_base: "https://api.anthropic.com/v1",
      default: false,
    };
    onChange({ ...config, models: [...config.models, newModel] });
  };

  const removeModel = (index: number) => {
    const newModels = config.models.filter((_, i) => i !== index);
    onChange({ ...config, models: newModels });
  };

  const updateModel = (index: number, field: keyof ModelConfig, value: any) => {
    const newModels = [...config.models];
    newModels[index] = { ...newModels[index], [field]: value };
    onChange({ ...config, models: newModels });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Models Configuration</h2>
        <button
          onClick={addModel}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Model
        </button>
      </div>

      <div className="space-y-4">
        {config.models.map((model, index) => (
          <CollapsibleSection
            key={index}
            title={model.name}
            subtitle={model.model}
            badge={
              model.default && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  DEFAULT
                </span>
              )
            }
            actions={
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={model.default || false}
                    onChange={(e) => updateModel(index, "default", e.target.checked)}
                    className="rounded"
                  />
                  Default
                </label>
                <button
                  onClick={() => removeModel(index)}
                  className="rounded-md p-1 hover:bg-destructive/10 text-destructive"
                  title="Remove model"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={model.name}
                  onChange={(e) => updateModel(index, "name", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  value={model.model}
                  onChange={(e) => updateModel(index, "model", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  API Key
                  <span className="text-muted-foreground ml-2 font-normal">
                    (Use secret: prefix for encryption, e.g., secret:sk-xxx)
                  </span>
                </label>
                <input
                  type="password"
                  value={model.api_key}
                  onChange={(e) => updateModel(index, "api_key", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">API Base</label>
                <input
                  type="text"
                  value={model.api_base || ""}
                  onChange={(e) => updateModel(index, "api_base", e.target.value || undefined)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="https://api.anthropic.com/v1"
                />
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Advanced Options
              </summary>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Token</label>
                    <input
                      type="number"
                      value={model.max_token || ""}
                      onChange={(e) => updateModel(index, "max_token", parseInt(e.target.value) || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="200000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Handoff Threshold</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={model.handoff_threshold || ""}
                      onChange={(e) => updateModel(index, "handoff_threshold", parseFloat(e.target.value) || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="0.8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Completion Max Tokens</label>
                    <input
                      type="number"
                      value={model.completion_max_tokens || ""}
                      onChange={(e) => updateModel(index, "completion_max_tokens", parseInt(e.target.value) || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="8192"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tool Result Max Chars</label>
                    <input
                      type="number"
                      value={model.tool_result_max_chars || ""}
                      onChange={(e) => updateModel(index, "tool_result_max_chars", parseInt(e.target.value) || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="100000"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Token URL</label>
                    <input
                      type="text"
                      value={model.token_url || ""}
                      onChange={(e) => updateModel(index, "token_url", e.target.value || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="https://oauth.example.com/token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client ID</label>
                    <input
                      type="text"
                      value={model.client_id || ""}
                      onChange={(e) => updateModel(index, "client_id", e.target.value || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={model.client_secret || ""}
                      onChange={(e) => updateModel(index, "client_secret", e.target.value || undefined)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Extra Config (JSON)
                    <span className="text-muted-foreground ml-2 font-normal">
                      For any additional fields not listed above
                    </span>
                  </label>
                  <textarea
                    value={getExtraConfigText(index)}
                    onChange={(e) => handleExtraConfigChange(index, e.target.value)}
                    onBlur={() => handleExtraConfigBlur(index)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                    rows={4}
                    placeholder='{"temperature": 0.7, "top_p": 0.9}'
                  />
                </div>
              </div>
            </details>
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}
