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
from fastapi import Request, HTTPException


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-agent AI system for verifying content authenticity",
    version="1.0.0",
    debug=settings.debug,
)

# Configure CORS middleware - MUST allow all origins for free tier compatibility
# The issue: Render's free tier may have proxy/gateway behavior that strips/modifies Origin headers
# Solution: Use wildcard CORS in development/free-tier, restrict in production
print(f"[Startup] Environment: {settings.environment}")
print(f"[Startup] Configuring CORS for free-tier deployment...")

allowed_origins = [
    "https://verify-x-two.vercel.app",  # Frontend (Vercel)
    "http://localhost:3000",            # Local dev
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Allow all origins for free tier (Render proxy compatibility)
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint for Render health checks."""
    return {
        "status": "ok",
        "message": "VerifyX backend live",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0",
    }


@app.get("/wake")
def wake():
    """Lightweight wake endpoint for cold starts."""
    return {"status": "awake"}


@app.get("/debug/config")
def debug_config(request: Request):
    """Debug endpoint to check configuration.

    Security and exposure rules:
    - Disabled in production (returns 404)
    - Requires X-Internal-Token header matching ADMIN_TOKEN when configured
    - Does not return API key material; only indicates presence
    """
    # Disable in production
    if getattr(settings, "environment", "development") == "production":
        raise HTTPException(status_code=404, detail="Not found")

    # If an admin token is configured, require it
    admin_token = getattr(settings, "ADMIN_TOKEN", None)
    if admin_token:
        provided = request.headers.get("X-Internal-Token")
        if not provided or provided != admin_token:
            raise HTTPException(status_code=401, detail="Unauthorized")

    return {
        "fact_check_api_key_present": bool(settings.FACT_CHECK_API_KEY),
        "enable_transformers": settings.ENABLE_TRANSFORMERS,
        "environment": settings.environment,
    }


# Include agent routers
app.include_router(linguistic_router)
app.include_router(evidence_router)
app.include_router(visual_router)
app.include_router(synth_router)

