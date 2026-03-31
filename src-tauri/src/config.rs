use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DmrConfig {
    pub verbose: i32,
    pub models: Vec<ModelConfig>,
    pub tape: TapeConfig,
    pub agent: AgentConfig,
    pub plugins: Vec<PluginConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelConfig {
    pub name: String,
    pub model: String,
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_base: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_token: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub handoff_threshold: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TapeConfig {
    pub driver: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dsn: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentConfig {
    pub max_steps: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginConfig {
    pub name: String,
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<serde_json::Value>,
}

impl DmrConfig {
    pub fn config_path() -> PathBuf {
        let home = dirs::home_dir().expect("Cannot find home directory");
        home.join(".dmr").join("config.toml")
    }

    pub fn exists() -> bool {
        Self::config_path().exists()
    }

    pub fn load() -> Result<Self, String> {
        let path = Self::config_path();
        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        toml::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();

        // 确保目录存在
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config dir: {}", e))?;
        }

        let content = toml::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        fs::write(&path, content)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        // 创建默认的 AGENTS.md 文件
        if let Some(ref system_prompt) = self.agent.system_prompt {
            for prompt_path in system_prompt {
                // 如果是相对路径（如 ./AGENTS.md），在 ~/.dmr/ 目录下创建
                let target_path = if prompt_path.starts_with("./") {
                    if let Some(home) = dirs::home_dir() {
                        home.join(".dmr").join(&prompt_path[2..])
                    } else {
                        continue;
                    }
                } else if prompt_path.starts_with("~/") {
                    if let Some(home) = dirs::home_dir() {
                        home.join(&prompt_path[2..])
                    } else {
                        continue;
                    }
                } else {
                    continue;
                };

                if !target_path.exists() {
                    if let Some(parent) = target_path.parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    let default_content = include_str!("../assets/AGENTS.md");
                    let _ = fs::write(&target_path, default_content);
                }
            }
        }

        Ok(())
    }

    pub fn default() -> Self {
        Self {
            verbose: 1,
            models: vec![ModelConfig {
                name: "claude-opus-4-6".to_string(),
                model: "claude-opus-4-6".to_string(),
                api_key: String::new(),
                api_base: Some("https://api.anthropic.com/v1".to_string()),
                default: Some(true),
                max_token: Some(200000),
                handoff_threshold: Some(0.8),
            }],
            tape: TapeConfig {
                driver: "sqlite".to_string(),
                dsn: None,
            },
            agent: AgentConfig {
                max_steps: 50,
                system_prompt: Some(vec!["./AGENTS.md".to_string()]),
            },
            plugins: vec![
                PluginConfig {
                    name: "command".to_string(),
                    enabled: true,
                    path: None,
                    config: None,
                },
                PluginConfig {
                    name: "shell".to_string(),
                    enabled: true,
                    path: None,
                    config: None,
                },
                PluginConfig {
                    name: "fs".to_string(),
                    enabled: true,
                    path: None,
                    config: None,
                },
                PluginConfig {
                    name: "tape".to_string(),
                    enabled: true,
                    path: None,
                    config: None,
                },
                PluginConfig {
                    name: "web".to_string(),
                    enabled: true,
                    path: None,
                    config: Some(serde_json::json!({
                        "server": {
                            "enabled": true,
                            "listen": ":8080",
                            "ui_path": "~/.dmr/web/dist"
                        }
                    })),
                },
            ],
        }
    }
}
