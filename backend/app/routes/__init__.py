"""
API route handlers for VerifyX endpoints.
"""

from app.routes.linguistic import router as linguistic_router
from app.routes.evidence import router as evidence_router
from app.routes.visual import router as visual_router
from app.routes.synth import router as synth_router

__all__ = [
    "linguistic_router",
    "evidence_router",
    "visual_router",
    "synth_router",
]