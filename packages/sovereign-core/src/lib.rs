mod mesh;
pub use mesh::{MeshRegistry, Peer};

use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use web_sys::console;

thread_local! {
    static LOGGING_INITIALIZED: RefCell<bool> = RefCell::new(false);
}

fn log_warn(msg: &str) {
    console::warn_1(&msg.into());
}

fn log_info(msg: &str) {
    console::log_1(&msg.into());
}

fn init_logging() {
    LOGGING_INITIALIZED.with(|initialized| {
        if !*initialized.borrow() {
            if let Err(_) = console_log::init_with_level(log::Level::Debug) {
                log_warn("[Sovereign] console_log init failed");
            } else {
                log_info("[Sovereign] Logging initialized at Debug level");
            }
            *initialized.borrow_mut() = true;
        }
    });
}

// ============================================================
// SovereignNode — mesh-aware entry point
// ============================================================

#[wasm_bindgen]
pub struct SovereignNode {
    node_id: String,
    registry: MeshRegistry,
}

#[wasm_bindgen]
impl SovereignNode {
    #[wasm_bindgen(constructor)]
    pub async fn new(node_id: String, signaling_url: Option<String>) -> Result<SovereignNode, JsValue> {
        init_logging();

        let signaling_url_for_registry = match &signaling_url {
            Some(url) => url,
            None => "",
        };
        let registry = MeshRegistry::new(node_id.clone(), signaling_url_for_registry.to_string());

        if let Some(url) = &signaling_url {
            if !url.is_empty() {
                if let Err(e) = registry.register_with_signaling().await {
                    log_warn(&format!("[Sovereign] register_with_signaling failed (non-fatal): {:?}", e));
                }
            } else {
                log_info("[Sovereign] signaling_url is empty string — local-only mode");
            }
        } else {
            log_info("[Sovereign] no signaling_url provided — local-only mode");
        }

        Ok(SovereignNode {
            node_id,
            registry,
        })
    }

    #[wasm_bindgen]
    pub fn get_status(&self) -> String {
        let peer_count = self.registry.get_all_peers().len();
        format!("Node {}: {} peers", self.node_id, peer_count)
    }

    #[wasm_bindgen]
    pub fn list_peers(&self) -> String {
        let peers = self.registry.get_all_peers();
        match serde_json::to_string(&peers) {
            Ok(s) => s,
            Err(_) => {
                log_warn("[Sovereign] list_peers serialization failed");
                "[]".to_string()
            }
        }
    }

    #[wasm_bindgen]
    pub async fn sync_remote_peers(&self) -> String {
        match self.registry.fetch_remote_peers().await {
            Ok(peers) => match serde_json::to_string(&peers) {
                Ok(s) => s,
                Err(_) => {
                    log_warn("[Sovereign] sync_remote_peers serialization failed");
                    "[]".to_string()
                }
            },
            Err(e) => {
                log_warn(&format!("[Sovereign] fetch_remote_peers failed (non-fatal): {:?}", e));
                "[]".to_string()
            }
        }
    }
}

// ============================================================
// SovereignState — LWW-Element-Set CRDT (unchanged)
// ============================================================

fn encode_string(s: &str) -> String {
    let mut out = String::from("\"");
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn encode_value(v: f64) -> String {
    v.to_string()
}

fn serialize_entries(entries: &std::collections::BTreeMap<String, (String, f64)>) -> String {
    let mut parts: Vec<String> = Vec::new();
    parts.push("{".to_string());
    for (i, (key, (val, ts))) in entries.iter().enumerate() {
        if i > 0 {
            parts.push(",".to_string());
        }
        parts.push(encode_string(key));
        parts.push(":[".to_string());
        parts.push(encode_string(val));
        parts.push(",".to_string());
        parts.push(encode_value(*ts));
        parts.push("]".to_string());
    }
    parts.push("}".to_string());
    parts.concat()
}

fn decode_json_str(s: &str, start: usize) -> Result<(String, usize), JsValue> {
    if s.as_bytes().get(start) != Some(&b'"') {
        return Err(JsValue::from_str("expected string start"));
    }
    let mut out = String::new();
    let mut i = start + 1;
    let bytes = s.as_bytes();
    while i < bytes.len() {
        let b = bytes[i];
        if b == b'"' {
            return Ok((out, i + 1));
        }
        if b == b'\\' {
            if i + 1 >= bytes.len() {
                return Err(JsValue::from_str("unexpected end of string"));
            }
            let esc = bytes[i + 1];
            match esc {
                b'"' => { out.push('"'); i += 2; }
                b'\\' => { out.push('\\'); i += 2; }
                b'n' => { out.push('\n'); i += 2; }
                b'r' => { out.push('\r'); i += 2; }
                b't' => { out.push('\t'); i += 2; }
                b'u' => {
                    if i + 5 >= bytes.len() {
                        return Err(JsValue::from_str("invalid unicode escape"));
                    }
                    let hex = std::str::from_utf8(&bytes[i + 2..i + 6])
                        .map_err(|_| JsValue::from_str("invalid unicode bytes"))?;
                    let code = u32::from_str_radix(hex, 16)
                        .map_err(|_| JsValue::from_str("invalid unicode hex"))?;
                    let ch = std::char::from_u32(code)
                        .ok_or_else(|| JsValue::from_str("invalid unicode code point"))?;
                    out.push(ch);
                    i += 6;
                }
                _ => return Err(JsValue::from_str("unknown escape sequence")),
            }
        } else {
            out.push(b as char);
            i += 1;
        }
    }
    Err(JsValue::from_str("unterminated string"))
}

fn decode_number(s: &str, start: usize) -> Result<(f64, usize), JsValue> {
    let mut i = start;
    if s.as_bytes().get(i) == Some(&b'-') {
        i += 1;
    }
    while i < s.len() && s.as_bytes()[i].is_ascii_digit() {
        i += 1;
    }
    if i < s.len() && s.as_bytes()[i] == b'.' {
        i += 1;
        while i < s.len() && s.as_bytes()[i].is_ascii_digit() {
            i += 1;
        }
    }
    if i < s.len() && (s.as_bytes()[i] == b'e' || s.as_bytes()[i] == b'E') {
        i += 1;
        if i < s.len() && (s.as_bytes()[i] == b'+' || s.as_bytes()[i] == b'-') {
            i += 1;
        }
        while i < s.len() && s.as_bytes()[i].is_ascii_digit() {
            i += 1;
        }
    }
    let num_str = &s[start..i];
    let val = num_str.parse::<f64>()
        .map_err(|_| JsValue::from_str(&format!("invalid number: {}", num_str)))?;
    Ok((val, i))
}

fn skip_ws(s: &str, i: usize) -> usize {
    let mut j = i;
    while j < s.len() && s.as_bytes()[j].is_ascii_whitespace() {
        j += 1;
    }
    j
}

fn parse_element(s: &str, i: usize) -> Result<(String, f64, usize), JsValue> {
    let i = skip_ws(s, i);
    let (val, j) = decode_json_str(s, i)?;
    let j = skip_ws(s, j);
    if s.as_bytes().get(j) != Some(&b',') {
        return Err(JsValue::from_str("expected comma in array"));
    }
    let j = skip_ws(s, j + 1);
    let (ts, k) = decode_number(s, j)?;
    let k = skip_ws(s, k);
    if s.as_bytes().get(k) != Some(&b']') {
        return Err(JsValue::from_str("expected array close"));
    }
    Ok((val, ts, k + 1))
}

fn deserialize_entries(s: &str) -> Result<std::collections::BTreeMap<String, (String, f64)>, JsValue> {
    let i = skip_ws(s, 0);
    if s.as_bytes().get(i) != Some(&b'{') {
        return Err(JsValue::from_str("expected object start"));
    }
    let mut map: std::collections::BTreeMap<String, (String, f64)> = std::collections::BTreeMap::new();
    let i = skip_ws(s, i + 1);
    if s.as_bytes().get(i) == Some(&b'}') {
        return Ok(map);
    }
    loop {
        let mut i = skip_ws(s, i);
        let (key, j) = decode_json_str(s, i)?;
        let j = skip_ws(s, j);
        if s.as_bytes().get(j) != Some(&b':') {
            return Err(JsValue::from_str("expected colon after key"));
        }
        let j = skip_ws(s, j + 1);
        if s.as_bytes().get(j) != Some(&b'[') {
            return Err(JsValue::from_str("expected array for value"));
        }
        let (val, ts, k) = parse_element(s, j + 1)?;
        map.insert(key, (val, ts));
        i = skip_ws(s, k);
        if s.as_bytes().get(i) == Some(&b',') {
            i += 1;
            continue;
        }
        if s.as_bytes().get(i) == Some(&b'}') {
            break;
        }
        return Err(JsValue::from_str("expected comma or object close"));
    }
    Ok(map)
}

#[wasm_bindgen]
pub struct SovereignState {
    entries: std::collections::BTreeMap<String, (String, f64)>,
}

#[wasm_bindgen]
impl SovereignState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SovereignState {
        SovereignState {
            entries: std::collections::BTreeMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn set_state(&mut self, key: String, value: String, timestamp: f64) {
        self.entries.insert(key, (value, timestamp));
    }

    #[wasm_bindgen]
    pub fn get_state(&self, key: String) -> Option<String> {
        self.entries.get(&key).map(|(v, _)| v.clone())
    }

    #[wasm_bindgen]
    pub fn merge_state(&mut self, serialized_state: String) -> Result<(), JsValue> {
        let incoming = deserialize_entries(&serialized_state)?;

        for (key, (new_value, new_ts)) in incoming {
            match self.entries.get(&key) {
                Some((_, existing_ts)) => {
                    if new_ts > *existing_ts {
                        self.entries.insert(key, (new_value, new_ts));
                    }
                }
                None => {
                    self.entries.insert(key, (new_value, new_ts));
                }
            }
        }

        Ok(())
    }

    #[wasm_bindgen]
    pub fn export_state(&self) -> Result<String, JsValue> {
        Ok(serialize_entries(&self.entries))
    }
}
