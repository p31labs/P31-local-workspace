fn main() {
    let out_dir = std::env::var("OUT_DIR").unwrap_or_else(|_| ".".into());
    tauri_build::build()
}
