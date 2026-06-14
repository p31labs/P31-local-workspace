mod audio;
mod db;
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            audio::start_863hz,
            audio::stop_863hz,
            audio::is_863hz_playing,
            commands::init_db,
            commands::mint_karma,
            commands::get_balance,
            commands::get_ledger_history,
            commands::embed_and_store,
            commands::query_similar,
            commands::ollama_generate,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
