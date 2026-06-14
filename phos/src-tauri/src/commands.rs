use tokio::sync::Mutex;
use std::sync::Arc;
use crate::db::PhosDb;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

type DbHandle = Arc<Mutex<Option<PhosDb>>>;
static DB: Lazy<DbHandle> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbedRequest {
    pub door: String,
    pub text: String,
    pub embedding: Vec<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryRequest {
    pub embedding: Vec<f32>,
    pub limit: i64,
}

#[tauri::command]
pub async fn init_db(path: String) -> Result<String, String> {
    let db = PhosDb::open(path.into()).map_err(|e| e.to_string())?;
    DB.lock().await.replace(db);
    Ok("Database initialized".to_string())
}

#[tauri::command]
pub async fn mint_karma(kind: String, delta: i64) -> Result<i64, String> {
    let db = DB.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.mint_karma(&kind, delta).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_balance() -> Result<i64, String> {
    let db = DB.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_balance().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ledger_history(limit: i64) -> Result<Vec<crate::db::KarmaEvent>, String> {
    let db = DB.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.get_ledger_history(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn embed_and_store(req: EmbedRequest) -> Result<i64, String> {
    let db = DB.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.embed_and_store(&req.door, &req.text, &req.embedding).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn query_similar(req: QueryRequest) -> Result<Vec<(f64, String, String)>, String> {
    let db = DB.lock().await;
    let db = db.as_ref().ok_or("Database not initialized")?;
    db.query_similar(&req.embedding, req.limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ollama_generate(prompt: String, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://127.0.0.1:11434/api/generate";
    let body = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });
    let response = client
        .post(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("HTTP error: {}", e))?;
    let text = response.text().await.map_err(|e| format!("Read error: {}", e))?;
    Ok(text)
}
