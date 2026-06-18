# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+1 PM captain-override endpoint
"""
Spoon Monitor - PHOS Cortex Service

Real-time cognitive state monitoring via behavioral telemetry:
- Keystroke velocity tracking (fatigue indicator)
- Language pattern analysis (abstraction drift -> exhaustion)
- Tool-task mismatch detection (loop counter)
- Red Board trigger detection (shutdown signals)

Spoon Scale (0-5):
    5: Full capacity
    4: Normal sustained work
    3: Focused work only
    2: Single task, binary choices
    1: Crisis mode, can't initiate
    0: Shutdown, no processing

Technical Reference: SOULSAFE_v1.0.md - Casualty Control

WebSocket endpoints:
    ws://localhost:5002/ws (broadcast listener)
    POST /api/event (HTTP event injection)
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import List, Optional, Dict, Any, Set
from enum import Enum
from dataclasses import dataclass

from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class SpoonLevel(int, Enum):
    ZERO = 0
    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5


class RedBoardIndicator(str, Enum):
    KEYSTROKE_DROP = "keystroke_velocity_drop"
    ABSTRACTION_DRIFT = "language_abstraction_drift"
    TOOL_TASK_LOOP = "tool_task_mismatch_loop"
    EXPLICIT_SHUTDOWN = "explicit_shutdown_signal"
    ARCING = "burnout_arcing"


@dataclass
class TelemetryEvent:
    timestamp: str
    event_type: str
    data: Dict[str, Any]


@dataclass
class SpoonStateSnapshot:
    current_spoon_level: SpoonLevel
    velocity_baseline: float
    velocity_current: float
    velocity_drop_percent: float
    language_abstraction_score: float
    tool_task_mismatches: int
    red_board_alerts: List[RedBoardIndicator]
    requires_intervention: bool
    timestamp: str


class EventRequest(BaseModel):
    event_type: str
    data: Dict[str, Any]


class SpoonMonitor:
    def __init__(self):
        self.events: List[TelemetryEvent] = []
        self.keystroke_baseline = 3.0
        self.current_spoon_level = SpoonLevel.FIVE
        self.captain_override_level: Optional[SpoonLevel] = None
        self.tool_task_mismatch_count = 0
        self.red_board_alerts: List[RedBoardIndicator] = []
        self.last_intervention = None
        self.websocket_clients: Set[WebSocket] = set()
        logger.info("SpoonMonitor initialized")

    def set_captain_override(self, level: int) -> None:
        if level < 0 or level > 5:
            raise ValueError(f"Captain override level must be 0-5, got {level}")
        self.captain_override_level = SpoonLevel(level)
        trim_event = TelemetryEvent(
            timestamp=datetime.now().isoformat(),
            event_type="manual_trim",
            data={
                "override_level": level,
                "previous_inferred": self.current_spoon_level.value,
                "operator": "captain",
            },
        )
        self.events.append(trim_event)
        logger.info(f"CAPTAIN OVERRIDE: spoon level manually set to {level} (was {self.current_spoon_level.value})")

    def infer_spoon_level(self) -> SpoonLevel:
        if self.captain_override_level is not None:
            return self.captain_override_level
        inferred = SpoonLevel.FIVE
        if len(self.red_board_alerts) > 0:
            inferred = SpoonLevel.ONE
            return inferred
        if len(self.events) > 5:
            velocity_drop = self._calculate_velocity_drop()
            if velocity_drop > 40:
                inferred = SpoonLevel(max(0, inferred.value - 1))
        if self.tool_task_mismatch_count > 3:
            inferred = SpoonLevel(max(0, inferred.value - 2))
        return inferred

    def _calculate_velocity_drop(self) -> float:
        if len(self.events) < 5:
            return 0.0
        recent_events = self.events[-10:]
        keystroke_events = [e for e in recent_events if e.event_type == "keystroke"]
        if len(keystroke_events) < 3:
            return 0.0
        timestamps = [datetime.fromisoformat(e.timestamp) for e in keystroke_events]
        intervals = [
            (timestamps[i+1] - timestamps[i]).total_seconds()
            for i in range(len(timestamps) - 1)
        ]
        if not intervals:
            return 0.0
        avg_interval = sum(intervals) / len(intervals)
        recent_velocity = 1.0 / avg_interval if avg_interval > 0 else 0.0
        drop = ((self.keystroke_baseline - recent_velocity) / self.keystroke_baseline) * 100
        return max(0, drop)

    def infer_language_abstraction(self, text: str) -> float:
        abstract_keywords = {
            "jitterbugging", "flow", "resonance", "frequency",
            "topology", "geometry", "tensor", "field", "space",
            "molecule", "atom", "vibration", "potential", "manifold",
            "consciousness", "being", "essence", "pattern"
        }
        concrete_keywords = {
            "code", "line", "function", "parameter", "return",
            "variable", "array", "loop", "condition", "file",
            "api", "endpoint", "database", "query", "result"
        }
        text_lower = text.lower()
        abstract_count = sum(1 for kw in abstract_keywords if kw in text_lower)
        concrete_count = sum(1 for kw in concrete_keywords if kw in text_lower)
        total = abstract_count + concrete_count
        if total == 0:
            return 0.5
        abstraction_score = abstract_count / total
        return min(1.0, abstraction_score)

    def detect_tool_task_mismatch(self, event_data: Dict[str, Any]) -> bool:
        if event_data.get("event_type") != "tool_switch":
            return False
        tool = event_data.get("tool", "unknown")
        recent_tools = [e.data.get("tool") for e in self.events[-5:] if e.event_type == "tool_switch"]
        same_tool_count = sum(1 for t in recent_tools if t == tool)
        if same_tool_count >= 3:
            self.tool_task_mismatch_count += 1
            if self.tool_task_mismatch_count == 3:
                self.red_board_alerts.append(RedBoardIndicator.TOOL_TASK_LOOP)
            return True
        return False

    def detect_shutdown_signals(self, message: str) -> bool:
        shutdown_keywords = {"stop", "i'm done", "done", "halt", "hold", "shutdown", "jitterbugging"}
        message_lower = message.lower()
        if any(kw in message_lower for kw in shutdown_keywords):
            self.red_board_alerts.append(RedBoardIndicator.EXPLICIT_SHUTDOWN)
            return True
        return False

    def process_event(self, event: TelemetryEvent) -> None:
        self.events.append(event)
        if event.event_type == "message":
            self.detect_shutdown_signals(event.data.get("text", ""))
            abstraction = self.infer_language_abstraction(event.data.get("text", ""))
            if abstraction > 0.8 and "code" not in event.data.get("text", "").lower():
                self.red_board_alerts.append(RedBoardIndicator.ABSTRACTION_DRIFT)
        if event.event_type == "tool_switch":
            self.detect_tool_task_mismatch(event.data)
        if event.event_type == "keystroke":
            drop = self._calculate_velocity_drop()
            if drop > 40 and RedBoardIndicator.KEYSTROKE_DROP not in self.red_board_alerts:
                self.red_board_alerts.append(RedBoardIndicator.KEYSTROKE_DROP)

    def get_state_snapshot(self) -> SpoonStateSnapshot:
        spoon_level = self.infer_spoon_level()
        velocity_drop = self._calculate_velocity_drop()
        recent_messages = [
            e.data.get("text", "") for e in self.events[-3:] if e.event_type == "message"
        ]
        avg_abstraction = (
            sum(self.infer_language_abstraction(m) for m in recent_messages) / len(recent_messages)
            if recent_messages else 0.0
        )
        requires_intervention = (
            len(self.red_board_alerts) > 0
            or self.tool_task_mismatch_count > 2
            or velocity_drop > 40
            or spoon_level.value < 2
        )
        return SpoonStateSnapshot(
            current_spoon_level=spoon_level,
            velocity_baseline=self.keystroke_baseline,
            velocity_current=self.keystroke_baseline * (1 - velocity_drop / 100),
            velocity_drop_percent=velocity_drop,
            language_abstraction_score=avg_abstraction,
            tool_task_mismatches=self.tool_task_mismatch_count,
            red_board_alerts=self.red_board_alerts,
            requires_intervention=requires_intervention,
            timestamp=datetime.now().isoformat(),
        )

app = FastAPI()
monitor = SpoonMonitor()

class CaptainOverrideRequest(BaseModel):
    level: int = Field(..., ge=0, le=5, description="Manual spoon level override (0-5)")


@app.get("/health")
async def health():
    return {"status": "operational", "spoon_level": monitor.infer_spoon_level().value}


@app.post("/api/captain-override")
async def captain_override(req: CaptainOverrideRequest):
    monitor.set_captain_override(req.level)
    return {
        "status": "override_applied",
        "captain_level": req.level,
        "inferred_level": monitor.current_spoon_level.value,
        "timestamp": datetime.now().isoformat(),
    }