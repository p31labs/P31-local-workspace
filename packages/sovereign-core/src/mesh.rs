use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use web_sys::{console, Window};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Peer {
    pub node_id: String,
    pub ip: String,
    pub port: u16,
    pub last_seen: f64,
}

#[derive(Debug, Clone)]
pub struct MeshRegistry {
    node_id: String,
    signaling_url: String,
    peers: Vec<Peer>,
}

impl MeshRegistry {
    pub fn new(node_id: String, signaling_url: String) -> Self {
        Self {
            node_id,
            signaling_url,
            peers: Vec::new(),
        }
    }

    pub async fn register_with_signaling(&self) -> Result<(), JsValue> {
        let window: Window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let url = format!("{}/register/{}", self.signaling_url, self.node_id);
        let resp = wasm_bindgen_futures::JsFuture::from(window.fetch_with_str(&url))
            .await
            .map_err(|e| {
                console::error_1(&format!("[Mesh] register fetch failed: {:?}", e).into());
                JsValue::from_str("fetch failed")
            })?;
        let resp = resp.dyn_into::<web_sys::Response>().map_err(|_| JsValue::from_str("not a Response"))?;
        if !resp.ok() {
            return Err(JsValue::from_str(&format!("HTTP {}", resp.status())));
        }
        console::log_1(&"[Mesh] registered with signaling server".into());
        Ok(())
    }

    pub async fn fetch_remote_peers(&self) -> Result<Vec<Peer>, JsValue> {
        let window: Window = web_sys::window().ok_or_else(|| JsValue::from_str("no window"))?;
        let url = format!("{}/peers/{}", self.signaling_url, self.node_id);
        let resp = wasm_bindgen_futures::JsFuture::from(window.fetch_with_str(&url))
            .await
            .map_err(|e| {
                console::error_1(&format!("[Mesh] peers fetch failed: {:?}", e).into());
                JsValue::from_str("fetch failed")
            })?;
        let resp = resp.dyn_into::<web_sys::Response>().map_err(|_| JsValue::from_str("not a Response"))?;
        if !resp.ok() {
            return Err(JsValue::from_str(&format!("HTTP {}", resp.status())));
        }
        let text = wasm_bindgen_futures::JsFuture::from(resp.text().map_err(|e| e)?)
            .await
            .map_err(|e| {
                console::error_1(&format!("[Mesh] text() failed: {:?}", e).into());
                JsValue::from_str("text failed")
            })?;
        let text_str = text.as_string().unwrap_or_default();
        let peers: Vec<Peer> = serde_json::from_str(&text_str).map_err(|e| {
            console::error_1(&format!("[Mesh] JSON parse failed: {}", e).into());
            JsValue::from_str("JSON parse failed")
        })?;
        Ok(peers)
    }

    pub fn get_all_peers(&self) -> Vec<Peer> {
        self.peers.clone()
    }

    pub fn merge_peers(&mut self, incoming: Vec<Peer>) {
        self.peers.extend(incoming);
    }
}
