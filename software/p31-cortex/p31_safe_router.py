# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+1 PM voltage wire + captain-override
"""
P31-SafeRouter: Lane Enforcement and Spoon Budget Modulation for LiteLLM

Enforces agent separation of powers (Triad of Cognition):
- Sonnet (Mechanic): code, UI, tests, debugging
- DeepSeek (Firmware): ESP32 C/C++, hardware registers
- Gemini (Narrator): grants, narrative, documentation
- Opus (Architect): system design, verification, QA

Also applies Spoon Budget constraints from WCD-01 (Pre-Job Brief):
- FULL (5 spoons): 2000 tokens, temp=0.5
- MEDIUM (3 spoons): 1000 tokens, temp=0.3
- LOW (1 spoon): 200 tokens, temp=0.1

VOLTAGE OVERRIDE (T+1 weld — affective chemistry integration):
When metadata carries a voltage_score [0.0, 1.0] from AffectiveChemistryEngine:
  voltage >= 0.85: force phos-fast-buffer (calm model), max_tokens=1000, temp=0.3
  voltage >= 0.70: force phos-cognitive-core, max_tokens=2000, temp=0.5
  voltage <  0.30: block routing entirely (raise P31Exception — reactor scram)
  captain_override=true: skip voltage check, trust manual input

WCD-01 Reference: SOULSAFE_v1.0.md - Work Control Documents
"""

import json
import logging
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class SpoonBudget(str, Enum):
    FULL = "FULL"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AgentLane(str, Enum):
    SONNET = "phos-cognitive-core"
    DEEPSEEK = "phos-fast-buffer"
    GEMINI = "phos-narrator"
    OPUS = "phos-architect"


class P31Exception(Exception):
    pass


class P31SafeRouter:
    AGENT_LANES = {
        AgentLane.SONNET: {
            "model": "qwen2.5-coder:7b",
            "description": "Mechanic",
            "allowed_tasks": {
                "code", "python", "javascript", "typescript",
                "react", "html", "css", "git", "bash",
                "tests", "vitest", "jest", "debug", "bugfix",
                "refactor", "ui_component", "styling"
            },
            "forbidden_tasks": {
                "architecture", "firmware", "esp32", "c_cpp",
                "registers", "grants", "nonprofit", "legal",
                "operator_state", "cognition_model"
            },
            "default_token_limit": 2000,
            "default_temperature": 0.5
        },
        AgentLane.DEEPSEEK: {
            "model": "llama3.2:3b",
            "description": "Firmware",
            "allowed_tasks": {
                "firmware", "c_cpp", "cpp", "esp32", "esp-idf",
                "registers", "drv2605l", "sx1262", "se050",
                "platformio", "cobs", "uart", "spi", "hardware"
            },
            "forbidden_tasks": {
                "ui", "react", "css", "architecture", "operator_state",
                "grants", "documentation", "system_design"
            },
            "default_token_limit": 1500,
            "default_temperature": 0.2
        },
        AgentLane.GEMINI: {
            "model": "gemini-pro",
            "description": "Narrator",
            "allowed_tasks": {
                "grants", "narrative", "documentation", "nonprofit",
                "marketing", "research", "technical_writing",
                "specification", "haat_framing"
            },
            "forbidden_tasks": {
                "code", "firmware", "architecture", "ui",
                "debugging", "protocol_values", "hex_codes"
            },
            "default_token_limit": 3000,
            "default_temperature": 0.7
        },
        AgentLane.OPUS: {
            "model": "claude-opus-4-6",
            "description": "Architect",
            "allowed_tasks": {
                "architecture", "system_design", "verification",
                "qa", "wcd_signoff", "error_detection",
                "defensive_publication", "technical_review"
            },
            "forbidden_tasks": {
                "minor_coding", "boilerplate", "variable_renaming",
                "trivial_refactoring"
            },
            "default_token_limit": 4000,
            "default_temperature": 0.3
        }
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.request_count = 0
        self.flagged_requests = []
        logger.info("P31SafeRouter initialized")

    def infer_task_type(self, messages: list) -> str:
        if not messages:
            return "unknown"
        user_msg = next(
            (m["content"] for m in messages if m.get("role") == "user"), ""
        ).lower()
        if any(k in user_msg for k in ["esp32", "firmware", "register", "drv2605", "sx1262", "cobs", "uart"]):
            return "firmware"
        if any(k in user_msg for k in ["code", "function", "test", "vitest", "react", "typescript", "debug", "bugfix"]):
            return "code"
        if any(k in user_msg for k in ["grant", "narrative", "nonprofit", "documentation", "haat"]):
            return "documentation"
        if any(k in user_msg for k in ["architecture", "design", "system", "topology", "flow"]):
            return "architecture"
        return "unknown"

    def apply_spoon_budget(self, request: Dict[str, Any], budget: SpoonBudget) -> Dict[str, Any]:
        budget_config = {
            SpoonBudget.FULL: {"max_tokens": 2000, "temperature": 0.5, "description": "Full capacity"},
            SpoonBudget.MEDIUM: {"max_tokens": 1000, "temperature": 0.3, "description": "Sustained focus"},
            SpoonBudget.LOW: {"max_tokens": 200, "temperature": 0.1, "description": "Binary decisions only"},
        }
        cfg = budget_config.get(budget, budget_config[SpoonBudget.FULL])
        request["max_tokens"] = cfg["max_tokens"]
        request["temperature"] = cfg["temperature"]
        request.setdefault("metadata", {})["spoon_budget"] = budget.value
        request.setdefault("metadata", {})["spoon_description"] = cfg["description"]
        return request

    def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        self.request_count += 1
        model_name = request.get("model", "unknown")
        messages = request.get("messages", [])
        metadata = request.get("metadata", {})
        wcd_01 = metadata.get("wcd_01", {})
        captain_override = metadata.get("captain_override", False)
        voltage_score = metadata.get("voltage_score")

        # VOLTAGE OVERRIDE — checks before lane routing
        if voltage_score is not None and not captain_override:
            v = float(voltage_score)
            if v >= 0.85:
                logger.warning(f"VOLTAGE OVERRIDE: v={v:.2f} >= 0.85 — routing to phos-fast-buffer (calm model)")
                model_name = "phos-fast-buffer"
                request.setdefault("metadata", {})["voltage_override"] = ">=0.85_calm"
            elif v >= 0.70:
                logger.info(f"VOLTAGE OVERRIDE: v={v:.2f} >= 0.70 — routing to phos-cognitive-core")
                model_name = "phos-cognitive-core"
                request.setdefault("metadata", {})["voltage_override"] = ">=0.70_full"
            elif v < 0.30:
                raise P31Exception(
                    f"REACTOR SCRAM: voltage={v:.2f} < 0.30 — routing blocked. "
                    f"Operator must manually confirm before proceeding."
                )

        # Re-resolve lane after potential voltage override
        lane = None
        lane_config = None
        for agent_lane, cfg in self.AGENT_LANES.items():
            if model_name == agent_lane.value or model_name in cfg["model"]:
                lane = agent_lane
                lane_config = cfg
                break

        if not lane:
            raise P31Exception(
                f"Model '{model_name}' not in agent lanes. Valid models: "
                f"{', '.join(cfg['model'] for cfg in self.AGENT_LANES.values())}"
            )

        task_type = self.infer_task_type(messages)

        if task_type != "unknown" and task_type not in lane_config["allowed_tasks"]:
            if task_type in lane_config["forbidden_tasks"]:
                self.flagged_requests.append({
                    "request_id": self.request_count,
                    "reason": "LANE_VIOLATION",
                    "agent": lane.value,
                    "task": task_type,
                    "message": f"Task '{task_type}' forbidden for {lane_config['description']}."
                })
                raise P31Exception(
                    f"Lane violation: '{task_type}' not allowed for {lane_config['description']}.\n"
                    f"Allowed tasks: {', '.join(sorted(lane_config['allowed_tasks']))}"
                )

        request = self.apply_spoon_budget(request, spoon_budget)

        if task_type in ("firmware", "architecture", "documentation", "grants"):
            request.setdefault("metadata", {})["expects_verification"] = True
            request.setdefault("metadata", {})["wcd_06_required"] = True

        logger.info(
            f"Request #{self.request_count}: {lane.value} | task={task_type} | "
            f"spoon={spoon_budget.value} | tokens={request.get('max_tokens')} | "
            f"temp={request.get('temperature')} | voltage={voltage_score} | "
            f"captain_override={captain_override}"
        )
        return request

    def get_flagged_summary(self) -> Dict[str, Any]:
        return {
            "total_requests": self.request_count,
            "flagged_count": len(self.flagged_requests),
            "flagged_requests": self.flagged_requests,
        }
