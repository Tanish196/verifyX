"""
VerifyX FastAPI Backend
Multi-agent AI verification system for content authenticity.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.linguistic import router as linguistic_router
from app.routes.evidence import router as evidence_router
from app.routes.visual import router as visual_router
from app.routes.synth import router as synth_router


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-agent AI system for verifying content authenticity",
    version="1.0.0",
    debug=settings.debug,
)

# Configure CORS middleware
cors_origins = (
    settings.CORS_ORIGINS.split(",") 
    if settings.CORS_ORIGINS != "*" 
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0",
    }


# Include agent routers
app.include_router(linguistic_router)
app.include_router(evidence_router)
app.include_router(visual_router)
app.include_router(synth_router)

