#[tauri::command]
pub fn start_time() -> String {
    return chrono::Local::now().to_string();
}
