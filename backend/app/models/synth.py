from pydantic import BaseModel, Field
from typing import Optional

class SynthesisRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000)
    linguistic: Optional[dict] = None
    evidence: Optional[dict] = None
    visual: Optional[dict] = None

class SynthesisResponse(BaseModel):
    agent_id: str = "agent4"
    verdict: str  # likely_true | uncertain | likely_fake
    confidence: float
    rationale: str
    supporting: dict
    latency_ms: int
