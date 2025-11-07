from fastapi import APIRouter, HTTPException
from ..models.synth import SynthesisRequest, SynthesisResponse
from ..services.synth_service import synthesize

router = APIRouter(prefix="/synthesize", tags=["synth"])


@router.post("", response_model=SynthesisResponse)
async def synthesis(payload: SynthesisRequest):
    try:
        return synthesize(
            payload.text,
            payload.linguistic,
            payload.evidence,
            payload.visual,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
