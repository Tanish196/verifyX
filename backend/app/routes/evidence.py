"""
Evidence checking endpoint.
Verifies claims using Google Fact Check API, falling back to Serper web evidence retrieval.
"""

from fastapi import APIRouter, HTTPException

from app.models.evidence import EvidenceRequest, EvidenceResponse
from app.services.evidence_service import check_evidence

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("", response_model=EvidenceResponse)
async def evidence_check(payload: EvidenceRequest):
    """
    Check evidence and verify claims in text.
    
    Args:
        payload: Text containing claims to verify
        
    Returns:
        EvidenceResponse with fact-checked results and accuracy score
        
    Raises:
        HTTPException: If evidence checking fails
    """
    try:
        return await check_evidence(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
