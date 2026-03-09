from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class EvidenceRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000)


class FactItem(BaseModel):
    """Legacy fact-item kept for backward compatibility with synth_service."""
    claim: str
    verdict: str
    source: Optional[str]
    url: Optional[str]
    confidence: float


class EvidenceItem(BaseModel):
    """Rich evidence item produced by the upgraded pipeline."""
    text: str
    url: Optional[str] = None
    stance: str
    credibility: float
    rerank_score: float


class StanceSummary(BaseModel):
    support: int
    refute: int
    neutral: int


class EvidenceResponse(BaseModel):
    agent_id: str = "agent2"
    provider: str
    facts_checked: List[FactItem]
    coverage_ratio: float
    # overall_accuracy_score is kept for backward compat with synth_service.
    # It equals the weighted evidence score produced by the new pipeline.
    overall_accuracy_score: float
    latency_ms: int
    # New pipeline output fields.
    score: float = 0.5
    stance_summary: Optional[StanceSummary] = None
    evidence: Optional[List[EvidenceItem]] = None
