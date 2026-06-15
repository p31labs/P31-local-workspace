export type StreamChunk = { text: string; done: boolean };

export class ShakeStream {
  private async invokeTauri(cmd: string, args?: Record<string, unknown>): Promise<string> {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<string>(cmd, args);
    }
    throw new Error('Not running in Tauri');
  }

  async streamQuery(
    payload: { prompt: string; model?: string; temperature?: number },
    onChunk: (text: string) => void
  ): Promise<void> {
    try {
      const responseJson = await this.invokeTauri("ollama_generate", {
        prompt: payload.prompt,
        model: payload.model ?? "qwen2:0.5b",
      });
      const parsed = JSON.parse(responseJson);
      const fullText = parsed.response || "";
      if (fullText) onChunk(fullText);
      else onChunk("[no response from model]");
    } catch (err) {
      console.error("Ollama invoke error:", err);
      onChunk(`⚠️ LLM error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
