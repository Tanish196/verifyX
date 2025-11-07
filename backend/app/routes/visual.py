"""
Visual analysis endpoint.
Analyzes image-text consistency using CLIP model.
"""

from fastapi import APIRouter, HTTPException

from app.models.visual import VisualRequest, VisualResponse
from app.services.visual_service import analyze_images

router = APIRouter(prefix="/visual", tags=["visual"])


@router.post("", response_model=VisualResponse)
async def visual_analysis(payload: VisualRequest):
    """
    Analyze consistency between images and text.
    
    Args:
        payload: Text and optional base64-encoded images
        
    Returns:
        VisualResponse with similarity scores and deepfake detection
        
    Raises:
        HTTPException: If visual analysis fails
    """
    try:
        images = payload.images or []
        return analyze_images(payload.text, images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
