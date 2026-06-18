# WCD-06: SIGNED — P31-OQE <2026-06-18> — T+2 cortex migration (source of truth)
"""
Affective Chemistry Engine - PHOS Cortex Service

FastAPI microservice implementing emotional valence modeling via VSEPR-inspired kinematics.
Translates task context (urgency, emotional load, cognitive complexity) into voltage scores
and modulation recommendations.

Technical Reference: SOULSAFE_v1.0.md  -  Affective Chemistry

Voltage Formula:
    V = (0.4 x Urgency) + (0.3 x Emotional_Load) + (0.3 x Cognitive_Complexity)

Where:
    Urgency in [0, 1]
    Emotional_Load in [0, 1]
    Cognitive_Complexity in [0, 1]
"""

import logging
from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class SpoonBudgetRecommendation(str, Enum):
    FULL = "FULL"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class VoltageAxes:
    urgency: float = 0.0
    emotional_load: float = 0.0
    cognitive_complexity: float = 0.0


@dataclass
class VoltageRecommendation:
    spoon_budget: SpoonBudgetRecommendation
    model_preference: str
    token_limit: int
    temperature: float
    requires_buffer: bool
    suggested_action: str


class AnalyzeRequest(BaseModel):
    input_text: str = Field(..., description="Task description or journal entry")
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional context: deadline_hours, stakeholders, domain_familiarity, etc."
    )


class AnalyzeResponse(BaseModel):
    voltage_score: float = Field(..., ge=0.0, le=1.0)
    axes: VoltageAxes
    recommendation: VoltageRecommendation
    interpretation: str


class AffectiveChemistryEngine:
    def __init__(self):
        self.request_count = 0

    def infer_urgency(self, input_text: str, context: Optional[Dict]) -> float:
        text_lower = input_text.lower()
        urgency = 0.0
        urgent_keywords = {"deadline", "today", "asap", "immediately", "urgent", "critical", "emergency"}
        if any(kw in text_lower for kw in urgent_keywords):
            urgency += 0.4
        if context and "deadline_hours" in context:
            hours = context.get("deadline_hours", 0)
            if hours < 6:
                urgency += 0.5
            elif hours < 24:
                urgency += 0.3
            elif hours < 72:
                urgency += 0.1
        consequence_keywords = {"children", "court", "legal", "disability", "medical", "life"}
        if any(kw in text_lower for kw in consequence_keywords):
            urgency += 0.3
        return min(1.0, urgency)

    def infer_emotional_load(self, input_text: str, context: Optional[Dict]) -> float:
        text_lower = input_text.lower()
        emotional = 0.0
        friction_keywords = {"dispute", "oppose", "fight", "conflict", "argue", "disagree"}
        if any(kw in text_lower for kw in friction_keywords):
            emotional += 0.3
        sensitive_keywords = {"children", "family", "wife", "ex", "personal", "private"}
        if any(kw in text_lower for kw in sensitive_keywords):
            emotional += 0.4
        trauma_keywords = {"abuse", "trauma", "loss", "grief", "pain", "suffering"}
        if any(kw in text_lower for kw in trauma_keywords):
            emotional += 0.5
        if context and "stakeholders" in context:
            stakeholders = context.get("stakeholders", [])
            if isinstance(stakeholders, list) and len(stakeholders) > 0:
                emotional += 0.2
        return min(1.0, emotional)

    def infer_cognitive_complexity(self, input_text: str, context: Optional[Dict]) -> float:
        text_lower = input_text.lower()
        complexity = 0.0
        unfamiliar_keywords = {"don't know", "new", "unfamiliar", "never", "first time", "unsure"}
        if any(kw in text_lower for kw in unfamiliar_keywords):
            complexity += 0.3
        abstract_keywords = {"system", "architecture", "design", "model", "theory", "framework"}
        if any(kw in text_lower for kw in abstract_keywords):
            complexity += 0.4
        domain_keywords = {"firmware", "legal", "financial", "medical", "engineering"}
        domain_count = sum(1 for kw in domain_keywords if kw in text_lower)
        complexity += domain_count * 0.15
        if context and "domain_familiarity" in context:
            familiarity = context.get("domain_familiarity", 0.5)
            complexity += (1.0 - familiarity) * 0.3
        return min(1.0, complexity)

    def calculate_voltage(self, urgency: float, emotional: float, cognitive: float) -> float:
        voltage = (0.4 * urgency) + (0.3 * emotional) + (0.3 * cognitive)
        return min(1.0, max(0.0, voltage))

    def recommend_spoon_budget(self, voltage: float) -> SpoonBudgetRecommendation:
        if voltage >= 0.7:
            return SpoonBudgetRecommendation.FULL
        elif voltage >= 0.4:
            return SpoonBudgetRecommendation.MEDIUM
        return SpoonBudgetRecommendation.LOW

    def get_recommendation(self, voltage: float, spoon_budget: SpoonBudgetRecommendation) -> VoltageRecommendation:
        budget_config = {
            SpoonBudgetRecommendation.FULL: {
                "model": "phos-cognitive-core",
                "token_limit": 2000,
                "temperature": 0.5,
                "requires_buffer": False,
            },
            SpoonBudgetRecommendation.MEDIUM: {
                "model": "phos-fast-buffer",
                "token_limit": 1000,
                "temperature": 0.3,
                "requires_buffer": False,
            },
            SpoonBudgetRecommendation.LOW: {
                "model": "phos-fast-buffer",
                "token_limit": 200,
                "temperature": 0.1,
                "requires_buffer": True,
            },
        }
        config = dict(budget_config[spoon_budget])
        if voltage >= 0.8:
            config["model"] = "phos-cognitive-core"
            config["requires_buffer"] = True
        action_map = {
            SpoonBudgetRecommendation.FULL: "Route to full-capacity model. Begin immediately.",
            SpoonBudgetRecommendation.MEDIUM: "Use sustained-focus model. Standard interaction.",
            SpoonBudgetRecommendation.LOW: "Minimal output. Yes/No only. Hold response if needed.",
        }
        return VoltageRecommendation(
            spoon_budget=spoon_budget,
            model_preference=config["model"],
            token_limit=config["token_limit"],
            temperature=config["temperature"],
            requires_buffer=config["requires_buffer"],
            suggested_action=action_map[spoon_budget],
        )

    def interpret_voltage(self, voltage: float) -> str:
        if voltage < 0.3:
            return "Low voltage: routine task, can batch or defer"
        elif voltage < 0.5:
            return "Moderate voltage: standard focus required"
        elif voltage < 0.7:
            return "High voltage: increased attention needed, monitor spoons"
        elif voltage < 0.85:
            return "Critical voltage: requires full capacity, immediate action"
        return "EMERGENCY: Red board possible, consider buffering or spoon depletion response"

    def analyze(self, input_text: str, context: Optional[Dict] = None) -> AnalyzeResponse:
        self.request_count += 1
        urgency = self.infer_urgency(input_text, context)
        emotional = self.infer_emotional_load(input_text, context)
        cognitive = self.infer_cognitive_complexity(input_text, context)
        voltage = self.calculate_voltage(urgency, emotional, cognitive)
        spoon_budget = self.recommend_spoon_budget(voltage)
        recommendation = self.get_recommendation(voltage, spoon_budget)
        logger.info(
            f"Request #{self.request_count}: voltage={voltage:.2f} | "
            f"U={urgency:.2f} E={emotional:.2f} C={cognitive:.2f} | spoon={spoon_budget.value}"
        )
        return AnalyzeResponse(
            voltage_score=voltage,
            axes=VoltageAxes(urgency=urgency, emotional_load=emotional, cognitive_complexity=cognitive),
            recommendation=recommendation,
            interpretation=self.interpret_voltage(voltage),
        )


app = FastAPI(
    title="Affective Chemistry Engine",
    description="Voltage scoring and emotional kinematics for PHOS Cortex",
    version="1.0",
)
engine = AffectiveChemistryEngine()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "affective-chemistry",
        "requests_processed": engine.request_count,
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    try:
        return engine.analyze(request.input_text, request.context)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/voltage/{urgency}/{emotional}/{cognitive}")
def quick_voltage(urgency: float, emotional: float, cognitive: float):
    voltage = engine.calculate_voltage(urgency, emotional, cognitive)
    spoon_budget = engine.recommend_spoon_budget(voltage)
    return {
        "voltage_score": voltage,
        "spoon_budget": spoon_budget.value,
        "interpretation": engine.interpret_voltage(voltage),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
