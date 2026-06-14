use rusqlite::Connection;
use rusqlite::OptionalExtension;
use rusqlite::params;
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use thiserror::Error;
use sha2::{Sha256, Digest};

#[derive(Error, Debug)]
pub enum DbError {
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KarmaEvent {
    pub kind: String,
    pub delta: i64,
    pub timestamp: i64,
    pub signature: String,
    pub prev_signature: String,
}

pub struct PhosDb {
    conn: Connection,
    #[allow(dead_code)]
    path: PathBuf,
}

impl PhosDb {
    pub fn open(path: PathBuf) -> Result<Self, DbError> {
        let conn = Connection::open(&path)?;

        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "cache_size", "-64000")?;
        conn.pragma_update(None, "mmap_size", "268435456")?;

        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS karma_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                delta INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                signature TEXT NOT NULL,
                prev_signature TEXT NOT NULL DEFAULT 'GENESIS'
            );
            CREATE INDEX IF NOT EXISTS idx_karma_timestamp ON karma_ledger(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_karma_signature ON karma_ledger(signature);
        ")?;

        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS knowledge_meta (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_door TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS knowledge_vec (
                meta_id INTEGER PRIMARY KEY,
                embedding BLOB NOT NULL,
                FOREIGN KEY (meta_id) REFERENCES knowledge_meta(id)
            );
            CREATE INDEX IF NOT EXISTS idx_source_door ON knowledge_meta(source_door);
        ")?;

        Ok(PhosDb { conn, path })
    }

    // --- Karma operations ---

    pub fn mint_karma(&self, kind: &str, delta: i64) -> Result<i64, DbError> {
        let ts = chrono::Utc::now().timestamp_millis();
        let prev_sig = self.get_last_signature()?;
        let new_sig = compute_hash(kind, delta, ts, &prev_sig);

        self.conn.execute(
            "INSERT INTO karma_ledger (kind, delta, timestamp, signature, prev_signature) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![kind, delta, ts, new_sig, prev_sig],
        )?;

        let balance: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(delta), 0) FROM karma_ledger",
            [],
            |r| r.get(0),
        )?;
        Ok(balance)
    }

    pub fn get_balance(&self) -> Result<i64, DbError> {
        let balance: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(delta), 0) FROM karma_ledger",
            [],
            |r| r.get(0),
        )?;
        Ok(balance)
    }

    pub fn get_ledger_history(&self, limit: i64) -> Result<Vec<KarmaEvent>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT kind, delta, timestamp, signature, prev_signature FROM karma_ledger ORDER BY id DESC LIMIT ?1"
        )?;
        let rows = stmt.query_map([limit], |row| {
            Ok(KarmaEvent {
                kind: row.get(0)?,
                delta: row.get(1)?,
                timestamp: row.get(2)?,
                signature: row.get(3)?,
                prev_signature: row.get(4)?,
            })
        })?;
        let mut result: Vec<KarmaEvent> = Vec::new();
        for row in rows {
            result.push(row?);
        }
        Ok(result)
    }

    // --- Vector operations ---

    pub fn embed_and_store(&self, door: &str, text: &str, embedding: &[f32]) -> Result<i64, DbError> {
        let id: i64 = self.conn.query_row(
            "INSERT INTO knowledge_meta (source_door, raw_text) VALUES (?1, ?2) RETURNING id",
            params![door, text],
            |r| r.get(0),
        )?;
        let blob: Vec<u8> = embedding.iter()
            .flat_map(|&f| f.to_le_bytes())
            .collect();
        self.conn.execute(
            "INSERT INTO knowledge_vec (meta_id, embedding) VALUES (?1, ?2)",
            params![id, blob],
        )?;
        Ok(id)
    }

    pub fn query_similar(&self, query_embedding: &[f32], limit: i64) -> Result<Vec<(f64, String, String)>, DbError> {
        let mut stmt = self.conn.prepare(
            "SELECT kv.meta_id, kv.embedding, km.source_door, km.raw_text \
             FROM knowledge_vec kv \
             JOIN knowledge_meta km ON kv.meta_id = km.id"
        )?;
        let rows = stmt.query_map([], |row| {
            let blob: Vec<u8> = row.get(1)?;
            let door: String = row.get(2)?;
            let text: String = row.get(3)?;
            let meta_id: i64 = row.get(0)?;
            let vec: Vec<f32> = blob.chunks_exact(4)
                .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                .collect();
            Ok((meta_id, vec, door, text))
        })?;

        let mut scored: Vec<(f64, String, String)> = Vec::new();
        for row in rows {
            let (_, vec, door, text) = row?;
            let score = cosine_similarity(query_embedding, &vec);
            scored.push((score, door, text));
        }

        scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
        scored.truncate(limit as usize);
        Ok(scored)
    }

    // --- Helpers ---

    fn get_last_signature(&self) -> Result<String, DbError> {
        let sig: Option<String> = self.conn.query_row(
            "SELECT signature FROM karma_ledger ORDER BY id DESC LIMIT 1",
            [],
            |r| r.get(0),
        ).optional()?;
        Ok(sig.unwrap_or_else(|| "GENESIS".to_string()))
    }
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    let mut dot: f64 = 0.0;
    let mut mag_a: f64 = 0.0;
    let mut mag_b: f64 = 0.0;
    for i in 0..a.len() {
        let ai = a[i] as f64;
        let bi = b[i] as f64;
        dot += ai * bi;
        mag_a += ai * ai;
        mag_b += bi * bi;
    }
    let denom = (mag_a * mag_b).sqrt();
    if denom == 0.0 { 0.0 } else { dot / denom }
}

fn compute_hash(kind: &str, delta: i64, ts: i64, prev: &str) -> String {
    let payload = format!("{}:{}:{}:{}", kind, delta, ts, prev);
    let hash = Sha256::digest(payload.as_bytes());
    hash.iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn db_schema_applies_cleanly() {
        let path_str = format!("/tmp/phos_e2e_schema_{}.db", std::process::id());
        let _ = PhosDb::open(path_str.clone().into()).expect("schema");
        let _ = fs::remove_file(&path_str);
    }

    #[test]
    fn karma_chain_has_no_collisions() {
        let path_str = format!("/tmp/phos_e2e_chain_{}.db", std::process::id());
        let db = PhosDb::open(path_str.into()).unwrap();
        let kinds = vec!["a", "b", "c"];
        let mut prev_sig = "GENESIS".to_string();
        for kind in &kinds {
            let bal = db.mint_karma(kind, 1).unwrap();
            let sig = db.conn.query_row("SELECT signature FROM karma_ledger ORDER BY id DESC LIMIT 1", [], |r| r.get(0)).unwrap();
            assert_ne!(sig, prev_sig, "signature collision for {}", kind);
            prev_sig = sig;
            assert!(bal >= 1);
        }
    }

    #[test]
    fn balance_accumulates() {
        let path = format!("/tmp/phos_e2e_bal_{}.db", std::process::id());
        let db = PhosDb::open(path.into()).unwrap();
        let _ = db.mint_karma("earn", 10);
        let _ = db.mint_karma("spend", -3);
        let _ = db.mint_karma("bonus", 5);
        assert_eq!(db.get_balance().unwrap(), 12);
    }

    #[test]
    fn embed_and_store_roundtrip() {
        let db = PhosDb::open("/tmp/phos_test_embed.db".into()).unwrap();
        let embedding = vec![0.1f32, 0.2, 0.3, 0.4];
        let _id = db.embed_and_store("door", "text", &embedding).unwrap();
        let rows = db.query_similar(&embedding, 1).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].0, 1.0); // identical → similarity 1.0
    }

    #[test]
    fn cosine_identical_is_one() {
        let v = vec![1.0f32, 0.0, 0.0];
        assert!((cosine_similarity(&v, &v) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_orthogonal_is_zero() {
        let a = vec![1.0f32, 0.0];
        let b = vec![0.0, 1.0];
        assert_eq!(cosine_similarity(&a, &b), 0.0);
    }

    #[test]
    fn cosine_empty_vectors() {
        assert_eq!(cosine_similarity(&[], &[]), 0.0);
        assert_eq!(cosine_similarity(&[1.0], &[]), 0.0);
    }
}
