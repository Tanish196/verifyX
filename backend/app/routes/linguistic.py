from fastapi import APIRouter, HTTPException
from ..models.linguistic import LinguisticRequest, LinguisticResponse
from ..services.linguistic_service import analyze_text

router = APIRouter(prefix="/linguistic", tags=["linguistic"])


@router.post("", response_model=LinguisticResponse)
async def linguistic_analysis(payload: LinguisticRequest):
	try:
		return analyze_text(payload.text)
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

