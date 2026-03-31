import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DmrConfig } from "../types/config";

export function useConfig() {
  const [config, setConfig] = useState<DmrConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const cfg = await invoke<DmrConfig>("get_config");
      setConfig(cfg);
    } catch (err) {
      setError(err as string);
      // If config doesn't exist, load default
      try {
        const defaultCfg = await invoke<DmrConfig>("get_default_config");
        setConfig(defaultCfg);
      } catch (e) {
        console.error("Failed to load default config:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: DmrConfig) => {
    try {
      setError(null);
      await invoke("save_config", { config: newConfig });
      setConfig(newConfig);
      return true;
    } catch (err) {
      setError(err as string);
      return false;
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    saveConfig,
    reloadConfig: loadConfig,
  };
}
