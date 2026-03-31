import { useState } from "react";
import { X, RotateCw, Save, MessageCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useConfig } from "../../hooks/useConfig";
import BasicSettings from "./BasicSettings";
import ModelsSettings from "./ModelsSettings";
import TapeSettings from "./TapeSettings";
import AgentSettings from "./AgentSettings";
import PluginsSettings from "./PluginsSettings";
import ExtPluginsSettings from "./ExtPluginsSettings";
import RestartDialog from "./RestartDialog";
import WeixinLogin from "../WeixinLogin";
import type { DmrConfig } from "../../types/config";

type SettingsSection = "basic" | "models" | "tape" | "agent" | "plugins" | "ext-plugins";
type RestartStatus = "restarting" | "waiting" | "success" | "error";

interface SettingsPageProps {
  onClose: () => void;
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { config: originalConfig, saveConfig: persistConfig, reloadConfig } = useConfig();
  const [activeSection, setActiveSection] = useState<SettingsSection>("basic");
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<DmrConfig | null>(originalConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [restartDialog, setRestartDialog] = useState({
    open: false,
    status: "restarting" as RestartStatus,
    message: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showWeixinLogin, setShowWeixinLogin] = useState(false);

  // Update local config when original loads
  if (originalConfig && !localConfig) {
    setLocalConfig(originalConfig);
  }

  const handleSave = async () => {
    if (!localConfig) return;

    setSaving(true);
    try {
      const success = await persistConfig(localConfig);
      if (success) {
        setHasChanges(false);
        alert("Configuration saved successfully");
      } else {
        alert("Failed to save configuration");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (newConfig: DmrConfig) => {
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleRestart = async () => {
    console.log("handleRestart called, hasChanges:", hasChanges);

    if (hasChanges) {
      alert("Please save your changes before restarting DMR");
      return;
    }

    // 显示确认对话框
    setShowConfirmDialog(true);
  };

  const confirmRestart = async () => {
    console.log("User confirmed restart");
    setShowConfirmDialog(false);

    console.log("Starting restart process...");

    // Show dialog
    setRestartDialog({
      open: true,
      status: "restarting",
      message: "Stopping DMR service...",
    });

    try {
      console.log("Calling restart_dmr command...");
      // Call restart command
      await invoke("restart_dmr");
      console.log("restart_dmr command completed");

      // Update status to waiting
      setRestartDialog({
        open: true,
        status: "waiting",
        message: "Waiting for DMR service to start...",
      });

      console.log("Waiting for health check...");
      // Wait for health check
      const healthy = await waitForHealth();
      console.log("Health check result:", healthy);

      if (healthy) {
        setRestartDialog({
          open: true,
          status: "success",
          message: "DMR restarted successfully!",
        });
      } else {
        setRestartDialog({
          open: true,
          status: "error",
          message: "DMR service failed to start. Please check logs.",
        });
      }
    } catch (err) {
      console.error("Restart error:", err);
      setRestartDialog({
        open: true,
        status: "error",
        message: `Failed to restart DMR: ${err}`,
      });
    }
  };

  const waitForHealth = async (): Promise<boolean> => {
    const maxAttempts = 60;
    console.log("Frontend health check starting...");
    for (let i = 0; i < maxAttempts; i++) {
      try {
        console.log(`Health check attempt ${i + 1}/${maxAttempts}`);
        const healthy = await invoke<boolean>("check_dmr_health");
        console.log(`Health check result: ${healthy}`);
        if (healthy) {
          console.log("Health check succeeded!");
          return true;
        }
      } catch (e) {
        console.log(`Health check failed: ${e}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("Health check timed out after 60 attempts");
    return false;
  };

  if (!localConfig) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const sections = [
    { id: "basic" as const, label: "Basic" },
    { id: "models" as const, label: "Models" },
    { id: "tape" as const, label: "Tape" },
    { id: "agent" as const, label: "Agent" },
    { id: "plugins" as const, label: "Plugins" },
    { id: "ext-plugins" as const, label: "Ext Plugins" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "basic":
        return <BasicSettings config={localConfig} onChange={updateConfig} />;
      case "models":
        return <ModelsSettings config={localConfig} onChange={updateConfig} />;
      case "tape":
        return <TapeSettings config={localConfig} onChange={updateConfig} />;
      case "agent":
        return <AgentSettings config={localConfig} onChange={updateConfig} />;
      case "plugins":
        return <PluginsSettings config={localConfig} onChange={updateConfig} />;
      case "ext-plugins":
        return <ExtPluginsSettings config={localConfig} onChange={updateConfig} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeixinLogin(true)}
            className="inline-flex items-center gap-2 rounded-md border border-green-500 bg-card px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            title="Bind WeChat account"
          >
            <MessageCircle className="size-4" />
            Bind WeChat
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            title="Save configuration"
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleRestart}
            disabled={restartDialog.open || hasChanges}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            title={hasChanges ? "Save changes first" : "Restart DMR to apply changes"}
          >
            <RotateCw className="size-4" />
            Restart DMR
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
            title="Close settings"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Navigation */}
        <div className="w-48 border-r border-border bg-muted/30">
          <nav className="p-4 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>

      {/* Restart Dialog */}
      <RestartDialog
        open={restartDialog.open}
        status={restartDialog.status}
        message={restartDialog.message}
        onClose={() => setRestartDialog({ ...restartDialog, open: false })}
      />

      {/* Confirm Restart Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">确认重启</h3>
            <p className="text-sm text-muted-foreground mb-6">
              确定要重启 DMR 服务吗？这将应用配置更改。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  console.log("User cancelled restart from dialog");
                  setShowConfirmDialog(false);
                }}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={confirmRestart}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                确定重启
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WeChat Login Dialog */}
      {showWeixinLogin && (
        <div className="fixed inset-0 z-50">
          <WeixinLogin
            onSuccess={() => {
              setShowWeixinLogin(false);
              alert("WeChat account bound successfully!");
            }}
            onSkip={() => setShowWeixinLogin(false)}
          />
        </div>
      )}
    </div>
  );
}
