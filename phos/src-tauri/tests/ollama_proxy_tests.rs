// src-tauri/tests/ollama_proxy_tests.rs
#[cfg(test)]
mod tests {
    use phos::commands::ollama_generate;

    #[tokio::test]
    async fn test_ollama_generate_returns_response() {
        let result = ollama_generate("Say hello".to_string(), "qwen2:0.5b".to_string()).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert!(response.contains("response"));
        let parsed: serde_json::Value = serde_json::from_str(&response).unwrap();
        assert!(parsed["response"].as_str().unwrap().len() > 0);
    }

    #[tokio::test]
    async fn test_ollama_generate_fails_with_invalid_model() {
        let result = ollama_generate("Hello".to_string(), "nonexistent-model".to_string()).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("model") || err.contains("404"));
    }
}
