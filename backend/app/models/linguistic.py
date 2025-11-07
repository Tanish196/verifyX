from pydantic import BaseModel, Field
from typing import Optional, List

class LinguisticRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000)

class ManipulationSignal(BaseModel):
    label: str
    confidence: float
    rationale: Optional[str] = None

class LinguisticResponse(BaseModel):
    agent_id: str = "agent1"
    model: str = "bart-large-mnli"
    dominant_tone: str
    sentiment: str
    manipulation_score: float
    signals: List[ManipulationSignal]
    raw_probs: dict
    latency_ms: int
