import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ModelConfig {
  name: string;
  model: string;
  api_key: string;
  api_base?: string;
  default?: boolean;
  max_token?: number;
  handoff_threshold?: number;
}

interface TapeConfig {
  driver: string;
  dsn?: string;
}

interface AgentConfig {
  max_steps: number;
  system_prompt?: string[];
}

interface PluginConfig {
  name: string;
  enabled: boolean;
  path?: string;
  config?: any;
}

interface DmrConfig {
  verbose: number;
  models: ModelConfig[];
  tape: TapeConfig;
  agent: AgentConfig;
  plugins: PluginConfig[];
}

const AVAILABLE_PLUGINS = [
  { id: 'command', name: 'Command', description: '命令执行插件' },
  { id: 'shell', name: 'Shell', description: 'Shell 命令执行' },
  { id: 'fs', name: 'File System', description: '文件系统操作' },
  { id: 'tape', name: 'Tape', description: 'Tape 管理' },
  { id: 'web', name: 'Web UI', description: 'Web 界面插件' },
  { id: 'ssh', name: 'SSH', description: 'SSH 连接管理（需要外部插件）' },
  { id: 'jira', name: 'Jira', description: 'Jira 集成（需要外部插件）' },
];

export default function Setup() {
  const [config, setConfig] = useState<DmrConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultConfig();
  }, []);

  async function loadDefaultConfig() {
    try {
      const defaultConfig = await invoke<DmrConfig>('get_default_config');
      setConfig(defaultConfig);
    } catch (err) {
      setError(`加载默认配置失败: ${err}`);
    }
  }

  async function handleSave() {
    if (!config) return;

    setSaving(true);
    setError(null);

    try {
      await invoke('save_config', { config });
      window.location.reload();
    } catch (err) {
      setError(`保存配置失败: ${err}`);
      setSaving(false);
    }
  }

  function togglePlugin(pluginId: string) {
    if (!config) return;

    const existingIndex = config.plugins.findIndex(p => p.name === pluginId);

    if (existingIndex > -1) {
      config.plugins[existingIndex].enabled = !config.plugins[existingIndex].enabled;
    } else {
      config.plugins.push({
        name: pluginId,
        enabled: true,
      });
    }

    setConfig({ ...config });
  }

  function isPluginEnabled(pluginId: string): boolean {
    if (!config) return false;
    const plugin = config.plugins.find(p => p.name === pluginId);
    return plugin ? plugin.enabled : false;
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  const defaultModel = config.models[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎使用 DMR Desktop
          </h1>
          <p className="text-gray-600 mb-8">
            首次启动需要配置基本信息
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* 模型配置 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">模型配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
                  <input
                    type="text"
                    value={defaultModel.model}
                    onChange={(e) => {
                      defaultModel.model = e.target.value;
                      defaultModel.name = e.target.value;
                      setConfig({ ...config });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="claude-opus-4-6"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    例如: claude-opus-4-6, gpt-4, glm-5
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={defaultModel.api_key}
                    onChange={(e) => {
                      defaultModel.api_key = e.target.value;
                      setConfig({ ...config });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL (可选)</label>
                  <input
                    type="text"
                    value={defaultModel.api_base || ''}
                    onChange={(e) => {
                      defaultModel.api_base = e.target.value || undefined;
                      setConfig({ ...config });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://api.anthropic.com/v1"
                  />
                </div>
              </div>
            </section>

            {/* Tape 存储配置 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tape 存储</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">存储驱动</label>
                <select
                  value={config.tape.driver}
                  onChange={(e) => {
                    config.tape.driver = e.target.value;
                    setConfig({ ...config });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="sqlite">SQLite (推荐)</option>
                  <option value="file">文件</option>
                  <option value="mem">内存</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  SQLite 会自动保存到 ~/.dmr/tapes.db
                </p>
              </div>
            </section>

            {/* Agent 配置 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent 配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大步数</label>
                  <input
                    type="number"
                    value={config.agent.max_steps}
                    onChange={(e) => {
                      config.agent.max_steps = parseInt(e.target.value) || 50;
                      setConfig({ ...config });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    max="200"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Agent 执行任务的最大步数，默认 50
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                  <input
                    type="text"
                    value={config.agent.system_prompt?.[0] || './AGENTS.md'}
                    onChange={(e) => {
                      config.agent.system_prompt = [e.target.value];
                      setConfig({ ...config });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    相对于 ~/.dmr/ 的路径，如 ./AGENTS.md，保存时会自动创建
                  </p>
                </div>
              </div>
            </section>

            {/* 插件配置 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">启用插件</h2>
              <div className="space-y-2">
                {AVAILABLE_PLUGINS.map((plugin) => (
                  <label key={plugin.id} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPluginEnabled(plugin.id)}
                      onChange={() => togglePlugin(plugin.id)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{plugin.name}</div>
                      <div className="text-sm text-gray-600">{plugin.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !defaultModel.api_key}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存并启动'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
