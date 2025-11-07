from pydantic import BaseModel, Field
from typing import List, Optional

class EvidenceRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000)

class FactItem(BaseModel):
    claim: str
    verdict: str
    source: Optional[str]
    url: Optional[str]
    confidence: float

class EvidenceResponse(BaseModel):
    agent_id: str = "agent2"
    provider: str
    facts_checked: List[FactItem]
    coverage_ratio: float
    overall_accuracy_score: float
    latency_ms: int
