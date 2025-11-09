"""
Synthesis service - combines all agent results into final verdict.
Weights: 50% evidence, 30% visual, 20% linguistic.
"""

import time
from typing import Optional, Dict, Any

from app.models.synth import SynthesisResponse


VERDICT_LABELS = ("likely_true", "uncertain", "likely_fake")


def _score_from_linguistic(ling: Optional[Dict[str, Any]]) -> float:
    if not ling:
        return 0.5
    return 1.0 - float(ling.get("manipulation_score", 0.5))  # higher is better


def _score_from_evidence(evid: Optional[Dict[str, Any]]) -> float:
    if not evid:
        return 0.5
    return float(evid.get("overall_accuracy_score", 0.5))


def _score_from_visual(vis: Optional[Dict[str, Any]]) -> float:
    if not vis:
        return 0.5
    return float(vis.get("average_similarity", 0.5))


def synthesize(
    text: str, 
    linguistic: Optional[Dict[str, Any]], 
    evidence: Optional[Dict[str, Any]], 
    visual: Optional[Dict[str, Any]]
) -> SynthesisResponse:
    """
    Synthesize results from all agents into a final verdict.
    
    Args:
        text: Original text being analyzed
        linguistic: Results from linguistic analysis
        evidence: Results from evidence checking
        visual: Results from visual analysis
        
    Returns:
        SynthesisResponse with overall verdict and confidence
    """
    start = time.time()

    ls = _score_from_linguistic(linguistic)
    es = _score_from_evidence(evidence)
    vs = _score_from_visual(visual)

    # Weighted blend: evidence most important, then visual, then linguistic
    score = 0.5 * es + 0.3 * vs + 0.2 * ls

    if score >= 0.66:
        verdict = "likely_true"
    elif score <= 0.34:
        verdict = "likely_fake"
    else:
        verdict = "uncertain"

    # Confidence grows as we move away from 0.5
    confidence = float(min(0.99, abs(score - 0.5) * 2))

    rationale = (
        f"Evidence score={es:.2f}, Visual similarity={vs:.2f}, Linguistic score={ls:.2f}. "
        f"Combined score={score:.2f} -> {verdict}."
    )

    latency_ms = int((time.time() - start) * 1000)
    return SynthesisResponse(
        verdict=verdict,
        confidence=confidence,
        rationale=rationale,
        supporting={
            "linguistic": linguistic or {},
            "evidence": evidence or {},
            "visual": visual or {},
        },
        latency_ms=latency_ms,
    )
