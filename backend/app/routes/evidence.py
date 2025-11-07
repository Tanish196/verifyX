from fastapi import APIRouter, HTTPException
from ..models.evidence import EvidenceRequest, EvidenceResponse
from ..services.evidence_service import check_evidence

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("", response_model=EvidenceResponse)
async def evidence_check(payload: EvidenceRequest):
    try:
        return check_evidence(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
