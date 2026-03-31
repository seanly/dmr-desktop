import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface StartupLoaderProps {
  onComplete: () => void;
}

type StartupStatus =
  | "checking"
  | "cleaning"
  | "waiting_port"
  | "starting"
  | "health_check"
  | "ready"
  | "error";

export default function StartupLoader({ onComplete }: StartupLoaderProps) {
  const [status, setStatus] = useState<StartupStatus>("checking");
  const [message, setMessage] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startDmr();
  }, []);

  const startDmr = async () => {
    try {
      // 检查配置
      setStatus("checking");
      setMessage("Checking configuration...");
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 清理旧进程
      setStatus("cleaning");
      setMessage("Cleaning up old processes...");
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 等待端口释放
      setStatus("waiting_port");
      setMessage("Waiting for port to be released...");
      setProgress(40);

      // 启动 DMR
      setStatus("starting");
      setMessage("Starting DMR service...");
      setProgress(60);

      await invoke("restart_dmr");

      // 健康检查
      setStatus("health_check");
      setMessage("Waiting for DMR to be ready...");
      setProgress(80);

      // 等待健康检查通过
      const healthy = await waitForHealth();

      if (healthy) {
        setStatus("ready");
        setMessage("DMR is ready!");
        setProgress(100);

        // In packaged Tauri app, redirect webview to dmr serve's HTTP server
        // so all /api/ requests are same-origin. Dev mode uses Vite proxy instead.
        const isTauri = "__TAURI_INTERNALS__" in window;
        if (isTauri) {
          try {
            const port = await invoke<number>("get_dmr_port");
            window.location.href = `http://localhost:${port}`;
            return; // webview will navigate away
          } catch (e) {
            console.error("Failed to get DMR port, falling back:", e);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        onComplete();
      } else {
        throw new Error("DMR health check failed");
      }
    } catch (err) {
      console.error("Startup error:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const waitForHealth = async (): Promise<boolean> => {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const healthy = await invoke<boolean>("check_dmr_health");
        if (healthy) {
          return true;
        }
      } catch (e) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  };

  const retry = () => {
    setError(null);
    setStatus("checking");
    setProgress(0);
    startDmr();
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">DMR Desktop</h1>
          <p className="text-muted-foreground">Starting up...</p>
        </div>

        {status === "error" ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">Startup Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={retry}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{message}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
              <span>Please wait...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
