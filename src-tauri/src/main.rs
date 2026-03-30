#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sidecar;
mod commands;

use sidecar::SidecarManager;
use tokio::sync::Mutex;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let sidecar = SidecarManager::new(8080);
            app.manage(Mutex::new(sidecar));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_sidecar,
            commands::stop_sidecar,
            commands::open_file,
            commands::get_sidecar_url,
        ])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
