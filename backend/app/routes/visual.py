from fastapi import APIRouter, HTTPException
from ..models.visual import VisualRequest, VisualResponse
from ..services.visual_service import analyze_images

router = APIRouter(prefix="/visual", tags=["visual"])


@router.post("", response_model=VisualResponse)
async def visual_analysis(payload: VisualRequest):
    try:
        images = payload.images or []
        return analyze_images(payload.text, images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
