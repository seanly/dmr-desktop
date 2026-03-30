use std::process::{Child, Command};
use std::time::Duration;
use std::env;
use std::path::PathBuf;

pub struct SidecarManager {
    process: Option<Child>,
    port: u16,
}

impl SidecarManager {
    pub fn new(port: u16) -> Self {
        Self {
            process: None,
            port,
        }
    }

    fn find_sidecar_binary() -> Result<PathBuf, String> {
        // 在开发模式下，二进制文件在 src-tauri/binaries/ 目录
        // 在生产模式下，Tauri 会将其打包到应用程序包中

        // 尝试从当前可执行文件的目录查找
        if let Ok(exe_path) = env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // 开发模式：target/debug/ 或 target/release/
                let dev_path = exe_dir.join("../../../src-tauri/binaries/dmr");
                if dev_path.exists() {
                    return Ok(dev_path);
                }

                // 生产模式：应用程序包中
                let prod_path = exe_dir.join("dmr");
                if prod_path.exists() {
                    return Ok(prod_path);
                }
            }
        }

        Err("Cannot find sidecar binary".to_string())
    }

    pub async fn start(&mut self) -> Result<(), String> {
        let sidecar_path = Self::find_sidecar_binary()?;
        let port_str = format!(":{}", self.port);

        let mut cmd = Command::new(sidecar_path);
        cmd.args(&["--listen", &port_str, "--tape", "desktop"]);

        let child = cmd.spawn().map_err(|e| format!("Failed to start sidecar: {}", e))?;

        self.process = Some(child);

        self.wait_for_health().await?;
        Ok(())
    }

    async fn wait_for_health(&self) -> Result<(), String> {
        for _ in 0..30 {
            if self.check_health().await.is_ok() {
                return Ok(());
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
        Err("Sidecar health check timeout".to_string())
    }

    async fn check_health(&self) -> Result<(), String> {
        let url = format!("http://localhost:{}/api/health", self.port);
        reqwest::get(&url)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), String> {
        if let Some(mut process) = self.process.take() {
            process.kill().map_err(|e| e.to_string())?;
            process.wait().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
