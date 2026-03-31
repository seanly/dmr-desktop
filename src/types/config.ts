export interface ModelConfig {
  name: string;
  model: string;
  api_key: string;
  api_base?: string;
  default?: boolean;
  max_token?: number;
  handoff_threshold?: number;
  completion_max_tokens?: number;
  tool_result_max_chars?: number;
  token_url?: string;
  client_id?: string;
  client_secret?: string;
}

export interface TapeConfig {
  driver: string;
  dsn?: string;
  dir?: string;
}

export interface AgentConfig {
  max_steps: number;
  max_token?: number;
  handoff_threshold?: number;
  completion_max_tokens?: number;
  tool_result_max_chars?: number;
  system_prompt?: string[] | null;
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  path?: string;
  config?: Record<string, any>;
}

export interface DmrConfig {
  verbose: number;
  models: ModelConfig[];
  tape: TapeConfig;
  agent: AgentConfig;
  plugins: PluginConfig[];
}
