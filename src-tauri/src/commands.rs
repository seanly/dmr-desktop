use tauri::{command, State};
use tokio::sync::Mutex;
use crate::sidecar::SidecarManager;

#[command]
pub async fn start_sidecar(state: State<'_, Mutex<SidecarManager>>) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.start().await
}

#[command]
pub async fn stop_sidecar(state: State<'_, Mutex<SidecarManager>>) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.stop().await
}

#[command]
pub async fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[command]
pub fn get_sidecar_url() -> String {
    "http://localhost:8080".to_string()
}
