"""
Synthesis endpoint.
Combines all agent results into a final verdict.
"""

from fastapi import APIRouter, HTTPException

from app.models.synth import SynthesisRequest, SynthesisResponse
from app.services.synth_service import synthesize

router = APIRouter(prefix="/synthesize", tags=["synth"])


@router.post("", response_model=SynthesisResponse)
async def synthesis(payload: SynthesisRequest):
    """
    Synthesize results from all agents into a final verdict.
    
    Args:
        payload: Text and optional results from other agents
        
    Returns:
        SynthesisResponse with overall verdict and confidence
        
    Raises:
        HTTPException: If synthesis fails
    """
    try:
        return synthesize(
            payload.text,
            payload.linguistic,
            payload.evidence,
            payload.visual,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
