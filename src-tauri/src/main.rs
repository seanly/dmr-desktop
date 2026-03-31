#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dmr;
mod config;
mod weixin_login;

use config::DmrConfig;
use dmr::DmrManager;
use weixin_login::WeixinLogin;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn weixin_get_qrcode() -> Result<weixin_login::QRCodeResponse, String> {
    let login = WeixinLogin::new();
    login.get_qrcode().await
}

#[tauri::command]
async fn weixin_poll_status(qrcode: String) -> Result<weixin_login::StatusResponse, String> {
    let login = WeixinLogin::new();
    login.poll_status(&qrcode).await
}

#[tauri::command]
async fn weixin_save_credentials(
    credentials: weixin_login::WeixinCredentials,
) -> Result<(), String> {
    use std::fs;

    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let cred_path = home.join(".dmr").join("weixin").join("credentials.json");

    // 创建目录
    if let Some(parent) = cred_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // 保存凭证
    let json = serde_json::to_string_pretty(&credentials)
        .map_err(|e| format!("Failed to serialize credentials: {}", e))?;

    fs::write(&cred_path, json)
        .map_err(|e| format!("Failed to write credentials: {}", e))?;

    Ok(())
}

#[tauri::command]
fn check_config_exists() -> bool {
    DmrConfig::exists()
}

#[tauri::command]
fn get_default_config() -> DmrConfig {
    DmrConfig::default()
}

#[tauri::command]
async fn save_config(config: DmrConfig) -> Result<(), String> {
    config.save()
}

#[tauri::command]
fn get_config() -> Result<DmrConfig, String> {
    DmrConfig::load()
}

#[tauri::command]
async fn check_dmr_health(app: tauri::AppHandle) -> Result<bool, String> {
    let port = get_dmr_port_from_state(&app);
    let url = format!("http://localhost:{}/api/health", port);
    match reqwest::get(&url).await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn get_dmr_port(app: tauri::AppHandle) -> Result<u16, String> {
    Ok(get_dmr_port_from_state(&app))
}

fn get_dmr_port_from_state(app: &tauri::AppHandle) -> u16 {
    if let Some(dmr_manager) = app.try_state::<Arc<Mutex<DmrManager>>>() {
        // Use try_lock to avoid blocking; fall back to 8080 if locked
        match dmr_manager.try_lock() {
            Ok(manager) => manager.port(),
            Err(_) => 8080,
        }
    } else {
        8080
    }
}

#[tauri::command]
async fn restart_dmr(app: tauri::AppHandle) -> Result<(), String> {
    // 尝试获取 dmr_manager，如果不存在说明是首次启动
    if let Some(dmr_manager) = app.try_state::<Arc<Mutex<DmrManager>>>() {
        let mut manager = dmr_manager.lock().await;

        // 停止当前进程
        manager.stop().await?;

        // 重新启动
        manager.start().await?;
    } else {
        // 首次启动，创建并启动 DMR
        let dmr = DmrManager::new();
        let dmr_manager = Arc::new(Mutex::new(dmr));

        {
            let mut manager = dmr_manager.lock().await;
            manager.start().await?;
        } // 释放锁

        // 保存到 app state
        app.manage(dmr_manager);
    }

    Ok(())
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.shell()
        .open(&path, None)
        .map_err(|e| format!("Failed to open file: {}", e))
}

#[tauri::command]
fn get_workspace_path() -> Result<String, String> {
    // 从 DMR 配置中读取 workspace 路径
    match DmrConfig::load() {
        Ok(_config) => {
            // 如果配置中有 workspace 字段，返回它
            // 否则返回默认的 ~/.dmr/workspace
            let home = dirs::home_dir().ok_or("Cannot find home directory")?;
            let workspace = home.join(".dmr").join("workspace");
            Ok(workspace.to_string_lossy().to_string())
        }
        Err(_) => {
            // 配置不存在时返回默认路径
            let home = dirs::home_dir().ok_or("Cannot find home directory")?;
            let workspace = home.join(".dmr").join("workspace");
            Ok(workspace.to_string_lossy().to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当尝试启动第二个实例时，激活已有窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }))
        .setup(|app| {
            // 检查配置是否存在
            if !DmrConfig::exists() {
                // 首次启动，显示配置向导
                let window = app.get_webview_window("main").unwrap();
                window.set_title("DMR 配置向导").unwrap();
                return Ok(());
            }

            // 配置存在，启动 DMR
            let dmr = DmrManager::new();
            let dmr_manager = Arc::new(Mutex::new(dmr));

            let dmr_clone = Arc::clone(&dmr_manager);
            tauri::async_runtime::spawn(async move {
                let mut manager = dmr_clone.lock().await;
                if let Err(e) = manager.start().await {
                    eprintln!("Failed to start DMR: {}", e);
                }
            });

            app.manage(dmr_manager);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_config_exists,
            get_default_config,
            save_config,
            get_config,
            restart_dmr,
            check_dmr_health,
            get_dmr_port,
            open_file,
            get_workspace_path,
            weixin_get_qrcode,
            weixin_poll_status,
            weixin_save_credentials
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let dmr_manager = window.state::<Arc<Mutex<DmrManager>>>();
                let dmr_clone = Arc::clone(&dmr_manager);
                tauri::async_runtime::block_on(async move {
                    let mut manager = dmr_clone.lock().await;
                    if let Err(e) = manager.stop().await {
                        eprintln!("Failed to stop DMR: {}", e);
                    }
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
