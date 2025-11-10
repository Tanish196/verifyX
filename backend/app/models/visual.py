from pydantic import BaseModel, Field
from typing import List, Optional

class VisualRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=5000)
    images: List[str] = []  # base64 strings or URLs

class ImageMatch(BaseModel):
    index: int
    similarity: float
    notes: Optional[str] = None
    renderer: Optional[str] = None

class VisualResponse(BaseModel):
    agent_id: str = "agent3"
    model: str = "clip-vit-base-patch32"
    average_similarity: float
    matches: List[ImageMatch]
    deepfake_flag: bool
    fallback: bool = False
    latency_ms: int