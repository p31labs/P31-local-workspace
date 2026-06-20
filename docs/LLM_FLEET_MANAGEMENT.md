# P31-FLOTILLA -- LLM Fleet Management

## Overview

P31-FLOTILLA is a subsystem of the P31 Shipyard Protocol that tracks, routes,
and monitors LLM models across multiple providers (OpenRouter, Kilo gateway,
local CLI, and web UIs). It assigns models to roles based on capability, cost,
and availability, ensuring the best model is used for each task while respecting
budget constraints.

## Key Concepts

- **Model Manifest** (`P31_LLM_MANIFEST.yaml`): source of truth for all
  available models, their capabilities, cost, and current health status.
- **Roles**: task categories (strategist, coder, reviewer, planner, debugger).
  Each defines preferred and fallback models.
- **Router**: core logic that selects a model, invokes it, and returns the
  response with automatic fallback on error.
- **Health Monitoring**: periodic checks of each model's availability, updating
  the manifest.
- **Cost Tracking**: logs usage and estimates cost per request.

## Installation

1. Ensure files are in place:
   ```
   P31-local-workspace/
   ├── P31_LLM_MANIFEST.yaml
   ├── scripts/p31-model-router.py
   ├── scripts/p31-model-health.sh
   ├── scripts/p31-model-discovery.sh
   └── docs/LLM_FLEET_MANAGEMENT.md
   ```

2. Make scripts executable:
   ```
   chmod +x scripts/p31-model-*.sh
   ```

3. Set environment variables:
   ```bash
   export OPENROUTER_API_KEY=***REDACTED***
   export KILO_GATEWAY_KEY="your-key"
   export P31_REPO_ROOT="/home/p31/P31-local-workspace"
   ```

4. Install Python dependencies:
   ```bash
   pip install pyyaml requests
   ```

5. Run discovery to fetch latest models:
   ```bash
   ./scripts/p31-model-discovery.sh
   ```

6. Schedule health monitoring (crontab):
   ```bash
   0 */6 * * * /home/p31/P31-local-workspace/scripts/p31-model-health.sh
   ```

## Usage

### Basic routing
```bash
p31-model-router --task "Write a function to parse JSON" --role coder
```

### Read prompt from file
```bash
p31-model-router --file ./prompt.txt --role strategist
```

### List available models
```bash
p31-model-router --list-models
```

### List roles
```bash
p31-model-router --list-roles
```

## Integration with Yardmaster

- `yardmaster flotilla-update` runs the discovery script.
- `yardmaster cycle` includes LLM health in the inspection.
- `P31-FUEL-BUDGET.yaml` can be extended with an `llm_budget` field.

## Cost Optimization

- The router prefers free models by default.
- Paid models (e.g., Opus) only used for high-value tasks (strategist role),
  subject to `max_cost_per_request`.
- All usage logged to `~/.p31/llm-router.log` for audit.

## Extending with New Models

1. Add entry to `P31_LLM_MANIFEST.yaml` under `models`.
2. If the provider is not yet supported, extend the router with a new `call_*`
   function.
3. Update health check script to ping the new endpoint.

## Future Improvements

- Browser automation for Gemini/DeepSeek web UI.
- Integration with OpenRouter pricing API for real-time cost estimates.
- Automatic model rotation based on performance metrics.
- User-defined cost tiers and quota management.

## Troubleshooting

- **Model not found**: run `p31-model-discovery.sh` to refresh the manifest.
- **API key error**: ensure `OPENROUTER_API_KEY` is set.
- **Local CLI not working**: verify `opencode` is installed and in PATH.
- **Web UI not available**: models marked as "available" by default; run health
  script manually to update.
