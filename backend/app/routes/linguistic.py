"""
Linguistic analysis endpoint.
Detects manipulation, sentiment, and tone in text.
"""

from fastapi import APIRouter, HTTPException

from app.models.linguistic import LinguisticRequest, LinguisticResponse
from app.services.linguistic_service import analyze_text

router = APIRouter(prefix="/linguistic", tags=["linguistic"])


@router.post("", response_model=LinguisticResponse)
async def linguistic_analysis(payload: LinguisticRequest):
    """
    Analyze text for linguistic manipulation patterns.
    
    Args:
        payload: Text content to analyze
        
    Returns:
        LinguisticResponse with manipulation score, sentiment, and signals
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        return analyze_text(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

