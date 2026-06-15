# JIT AI Provisioning Architecture — P31 Ecosystem

## Goal

Tauri desktop apps ship at ~15MB (binary + UI only). On first boot they detect the host hardware and pull a quantized GGUF model from Cloudflare R2. Total first-run experience: <60 seconds on a 20 Mbps connection.

---

## 1. Hardware Detection (Tauri Rust Backend)

Runs lazily on app startup before any UI is shown. Detection lives in `src-tauri/src/ai/hardware.rs` and is exposed via a Tauri command `detect_hardware`.

### Detection Steps

| Layer | Linux | macOS (Apple Silicon) | Windows |
|---|---|---|---|
| CPU vendor | `/proc/cpuinfo` → `GenuineIntel` / `AuthenticAMD` | `sysctl -n machdep.cpu.vendor` | `wmic cpu get Manufacturer` |
| Micro-arch flags | AVX2, AVX-512, FMA3 (cpuinfo crate) | `hw.optional.avx2`, `hw.optional.neon` | `IsAvx2Supported()` |
| GPU vendor | `lspci \| grep VGA` → NVIDIA / AMD / Intel | Metal GPU family via `ioMainConnect` | DXGI adapter via `wgpu` |
| VRAM estimate | `nvidia-smi --query-gpu=memory.total` or heuristics | Unified memory (system RAM) | `nvidia-smi` or WDDM |

### Output Enum

```rust
pub enum HardwareProfile {
    AppleSilicon {   // M1/M2/M3/M4 — use Metal GGUF
        metal: bool,
        unified_mem_gb: u32,
    },
    NvidiaGpu {      // Discrete CUDA — use CUDA GGUF or Q4_K_M with GPU layers
        vram_gb: u32,
        cuda_capability: (u32, u32),
    },
    AmdGpu {         // ROCm or Vulkan path
        vram_gb: u32,
    },
    IntelCpu {       // AVX2 baseline — Q4_K_M CPU-only
        avx512: bool,
    },
    AmdCpu {         // Zen 3+ — AVX2 baseline
        avx512: bool,
    },
    Fallback,        // Unknown — smallest model, CPU-only
}
```

Profile is cached in Tauri state for the session and persisted to app-local storage for cross-session use.

---

## 2. Model Selection Strategy

Maps `HardwareProfile` to a primary model + quant and a fallback chain.

### Decision Table

| Profile | Primary | Size | Fallback 1 | Fallback 2 |
|---|---|---|---|---|
| AppleSilicon ≥16 GB | `qwen2.5:3b-q4_k_m` | ~2.1 GB | `qwen2.5:1.5b-q4_k_m` | `phi-3-mini:3.8b-q4_k_m` |
| AppleSilicon ≤8 GB | `qwen2.5:1.5b-q4_k_m` | ~1.1 GB | `phi-3-mini:3.8b-q4_k_m` | `tinyllama:1.1b-q4_k_m` |
| Nvidia ≥6 GB VRAM | `qwen2.5:3b-q4_k_m` | ~2.1 GB | `llama-3.2:3b-q4_k_m` | `qwen2.5:1.5b-q4_k_m` |
| Nvidia <6 GB / AMD | `qwen2.5:1.5b-q4_k_m` | ~1.1 GB | `tinyllama:1.1b-q4_k_m` | `qwen2.5:0.5b-q4_k_m` |
| Intel / AMD CPU | `qwen2.5:1.5b-q4_k_m` | ~1.1 GB | `tinyllama:1.1b-q4_k_m` | `qwen2.5:0.5b-q4_k_m` |
| Fallback (unknown) | `tinyllama:1.1b-q4_k_m` | ~700 MB | `qwen2.5:0.5b-q4_k_m` | error |

Q4_K_M is the target quantization — best quality-per-byte for most hardware. Q8_0 is only used for NV ≤4 GB if the user opts in.

---

## 3. R2 Fetch Flow

### Architecture

```
Tauri App
  → fetch model-manifest.json from R2 (public bucket, cache-busted)
  → select primary model from manifest based on hardware profile
  → request pre-signed download URL from Worker (or use direct public URL)
  → stream GGUF to disk with SHA-256 verification
  → call `ollama create` to register
  → notify UI: ready
```

### Manifest Fetch

`GET https://<bucket>.r2.cloudflarestorage.com/manifest/model-manifest.json`
With `Cache-Control: no-cache` and `?ts=<unix>` bust parameter.

### Download URL

**Preferred:** Worker-generated pre-signed URL (5-minute expiry). The Worker maps model ID → R2 internal key, checks a model allow-list, and returns a time-limited `X-R2-Presigned-Url` header.

**Simpler alternative (MVP):** Public R2 bucket with Cloudflare Token Binding. The bucket is not indexed; direct URLs are only known to the app.

### Streaming Download

```
curl -L --retry 3 --retry-delay 2 \
  -H "Authorization: Bearer <optional-token>" \
  "$PRESIGNED_URL" \
  -o /tmp/p31-model-download.tmp \
  --progress-bar
```

Write to a `.tmp` path first; rename to final path only after checksum passes. Atomic write prevents corrupt partial downloads from being treated as valid.

---

## 4. On-Disk Cache & Validation

### Cache Directory

| Platform | Path |
|---|---|
| Linux | `~/.local/share/p31.ai/models/` |
| macOS | `~/Library/Application Support/dev.p31.app/models/` |
| Windows | `%LOCALAPPDATA%\dev.p31.app\models\` |

### File Layout

```
models/
├── manifests/
│   └── model-manifest.json        # Last-fetched manifest
├── downloaded/                    # Verified, ready models
│   ├── qwen2.5-1.5b-q4_k_m.gguf
│   └── .sha256                    # Sidecar: "<sha256 hash>  filename"
├── in-progress/                   # Temp downloads (cleaned on restart)
│   └── <random-tmp-name>
└── ollama-tags                    # Snapshot of `ollama list` JSON
```

### Validation

1. After download, compute SHA-256 of the `.tmp` file.
2. Compare against the `sha256` field in `model-manifest.json`.
3. On match: rename `.tmp` → final path, write sidecar `.sha256`, call `ollama create`.
4. On mismatch: delete `.tmp`, increment `download_attempts` counter in app storage. After 3 failures, surface error to user and offer manual download URL.

### Resumability

If the existing file is present and its sidecar hash matches the manifest → skip download. If the manifest is newer (HTTP `ETag` changed) → delete old file and re-download.

---

## 5. Ollama Integration

Ollama must be running before the app registers the model. Detection order:

1. Check for `ollama` binary on `PATH`.
2. Check default socket `unix:///tmp/ollama.sock` (Linux/macOS) or `http://localhost:11434` (Windows).
3. If not running: spawn `ollama serve` as a background child process (Tauri async task), wait up to 10 seconds for health check.

### Registration

```bash
ollama create <model-tag> --from-file /path/to/<file>.gguf
```

The `<model-tag>` is derived from the manifest `id` field, e.g. `qwen2.5:1.5b-q4_k_m`.

### Post-Registration

```
ollama list --json > models/ollama-tags
ollama pull <model-tag>  # No-op if already local; confirms registration
```

The model is then available to the Tauri app via Ollama's HTTP API at `http://localhost:11434/api/generate`.

---

## 6. Fallback Chain

If any stage fails, degrade gracefully:

```
Hardware detection fails       → use Fallback profile
Manifest fetch fails (3×)      → use embedded hardcoded manifest (last known good)
R2 download fails (3×)         → surface "download manually" deep-link
Checksum mismatch (3×)         → surface error + log anomaly to Cloudflare Analytics
Ollama not found               → show user prompt: "Install Ollama from ollama.com"
Ollama create fails            → attempt `ollama pull <tag>` as alternative path
GPU layer OOM at runtime       → re-run with fewer `--num-gpu` layers; if still fails, fall back to next model in chain
```

All failures are reported to the Tauri frontend as structured events so the UI can show progress and actionable error states without blocking.
