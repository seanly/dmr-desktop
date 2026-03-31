#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dmr;
mod config;

use config::DmrConfig;
use dmr::DmrManager;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

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

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 检查配置是否存在
            if !DmrConfig::exists() {
                // 首次启动，显示配置向导
                let window = app.get_webview_window("main").unwrap();
                window.set_title("DMR 配置向导").unwrap();
                return Ok(());
            }

            // 配置存在，启动 DMR
            let dmr = DmrManager::new(8080);
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
            save_config
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
