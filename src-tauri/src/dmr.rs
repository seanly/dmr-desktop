use std::process::{Child, Command};
use std::time::Duration;
use std::env;
use std::path::PathBuf;

#[cfg(unix)]
use std::os::unix::process::CommandExt;

pub struct DmrManager {
    process: Option<Child>,
    port: u16,
}

impl DmrManager {
    pub fn new(port: u16) -> Self {
        Self {
            process: None,
            port,
        }
    }

    fn find_dmr_binary() -> Result<PathBuf, String> {
        // 1. 尝试从 Tauri sidecar 查找（生产环境）
        if let Ok(exe_path) = env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // macOS: DMR Desktop.app/Contents/MacOS/dmr
                let sidecar_path = exe_dir.join("dmr");
                if sidecar_path.exists() {
                    return Ok(sidecar_path);
                }

                // 开发模式：target/debug/../src-tauri/binaries/dmr
                if let Some(target_dir) = exe_dir.parent() {
                    if let Some(project_root) = target_dir.parent() {
                        let dev_path = project_root.join("src-tauri/binaries/dmr");
                        if dev_path.exists() {
                            return Ok(dev_path);
                        }
                    }
                }
            }
        }

        // 2. 尝试从 PATH 查找（开发环境）
        if let Ok(path) = which::which("dmr") {
            return Ok(path);
        }

        Err("Cannot find dmr binary".to_string())
    }

    pub async fn start(&mut self) -> Result<(), String> {
        let dmr_path = Self::find_dmr_binary()?;
        eprintln!("Found DMR binary at: {:?}", dmr_path);

        let mut cmd = Command::new(&dmr_path);
        cmd.args(&["serve", "-vv"]);

        // 设置环境变量
        cmd.env("DMR_WEB_PORT", self.port.to_string());

        // 在 Unix 系统上创建新的进程组，以便可以一次性杀死所有子进程
        #[cfg(unix)]
        unsafe {
            cmd.pre_exec(|| {
                libc::setpgid(0, 0);
                Ok(())
            });
        }

        eprintln!("Starting DMR serve on port {}...", self.port);
        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start DMR: {}", e))?;

        self.process = Some(child);
        eprintln!("DMR process started, waiting for health check...");

        // 等待 web plugin 启动
        self.wait_for_health().await?;
        eprintln!("DMR health check passed!");
        Ok(())
    }

    async fn wait_for_health(&self) -> Result<(), String> {
        for _ in 0..30 {
            if self.check_health().await.is_ok() {
                return Ok(());
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
        Err("DMR health check timeout".to_string())
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
            #[cfg(unix)]
            {
                // 在 Unix 系统上，杀死整个进程组（包括所有子进程）
                let pid = process.id();
                unsafe {
                    libc::kill(-(pid as i32), libc::SIGTERM);
                }
                // 等待进程退出
                tokio::time::sleep(Duration::from_secs(2)).await;
                // 如果还没退出，强制杀死
                let _ = process.kill();
            }

            #[cfg(not(unix))]
            {
                process.kill().map_err(|e| e.to_string())?;
            }

            process.wait().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
