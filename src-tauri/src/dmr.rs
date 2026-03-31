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

    /// 清理已有的 DMR 进程和插件进程
    async fn cleanup_existing_processes(&self) -> Result<(), String> {
        #[cfg(unix)]
        {
            eprintln!("Checking for existing DMR processes...");

            // 查找所有 dmr 进程
            let output = Command::new("pgrep")
                .arg("-f")
                .arg("dmr serve")
                .output();

            if let Ok(output) = output {
                let pids = String::from_utf8_lossy(&output.stdout);
                if !pids.trim().is_empty() {
                    eprintln!("Found existing DMR processes, cleaning up...");
                    for pid in pids.trim().lines() {
                        if let Ok(pid_num) = pid.parse::<i32>() {
                            eprintln!("Killing DMR process: {}", pid_num);
                            unsafe {
                                libc::kill(pid_num, libc::SIGTERM);
                            }
                        }
                    }
                    // 等待进程退出
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }

            // 查找所有 dmr-plugin 进程
            let output = Command::new("pgrep")
                .arg("-f")
                .arg("dmr-plugin")
                .output();

            if let Ok(output) = output {
                let pids = String::from_utf8_lossy(&output.stdout);
                if !pids.trim().is_empty() {
                    eprintln!("Found existing DMR plugin processes, cleaning up...");
                    for pid in pids.trim().lines() {
                        if let Ok(pid_num) = pid.parse::<i32>() {
                            eprintln!("Killing plugin process: {}", pid_num);
                            unsafe {
                                libc::kill(pid_num, libc::SIGTERM);
                            }
                        }
                    }
                    // 等待进程退出
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }

            // 等待端口释放
            eprintln!("Waiting for port {} to be released...", self.port);
            for i in 0..10 {
                tokio::time::sleep(Duration::from_secs(1)).await;
                if !self.is_port_in_use().await {
                    eprintln!("Port {} is now available", self.port);
                    break;
                }
                if i == 9 {
                    return Err(format!("Port {} is still in use after cleanup", self.port));
                }
                eprintln!("Port {} still in use, waiting... ({}/10)", self.port, i + 1);
            }
        }

        #[cfg(windows)]
        {
            eprintln!("Checking for existing DMR processes...");

            // Windows: 使用 taskkill
            let _ = Command::new("taskkill")
                .args(&["/F", "/IM", "dmr.exe"])
                .output();

            let _ = Command::new("taskkill")
                .args(&["/F", "/FI", "IMAGENAME eq dmr-plugin*"])
                .output();

            tokio::time::sleep(Duration::from_secs(2)).await;
        }

        Ok(())
    }

    /// 检查端口是否被占用
    async fn is_port_in_use(&self) -> bool {
        use std::net::TcpListener;
        TcpListener::bind(format!("127.0.0.1:{}", self.port)).is_err()
    }

    pub async fn start(&mut self) -> Result<(), String> {
        // 先清理已有的进程
        self.cleanup_existing_processes().await?;

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
        eprintln!("Waiting for DMR health check...");
        for i in 0..60 {  // 增加到 60 秒
            if self.check_health().await.is_ok() {
                eprintln!("Health check passed after {} seconds", i + 1);
                return Ok(());
            }
            if i % 5 == 0 {
                eprintln!("Still waiting for DMR to be ready... ({}/60)", i + 1);
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
        Err("DMR health check timeout after 60 seconds".to_string())
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
            eprintln!("Stopping DMR process...");

            #[cfg(unix)]
            {
                // 在 Unix 系统上，杀死整个进程组（包括所有子进程）
                let pid = process.id();
                eprintln!("Sending SIGTERM to process group {}", pid);
                unsafe {
                    libc::kill(-(pid as i32), libc::SIGTERM);
                }

                // 等待进程优雅退出，最多等待 10 秒
                for i in 0..10 {
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    match process.try_wait() {
                        Ok(Some(status)) => {
                            eprintln!("DMR process exited with status: {}", status);
                            return Ok(());
                        }
                        Ok(None) => {
                            eprintln!("Waiting for DMR to exit... ({}/10)", i + 1);
                        }
                        Err(e) => {
                            eprintln!("Error checking process status: {}", e);
                        }
                    }
                }

                // 如果 10 秒后还没退出，强制杀死
                eprintln!("DMR didn't exit gracefully, force killing...");
                let _ = process.kill();
                let _ = process.wait();
            }

            #[cfg(not(unix))]
            {
                process.kill().map_err(|e| e.to_string())?;
                process.wait().map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }
}
