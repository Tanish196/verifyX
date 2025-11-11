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

# Configure CORS middleware (robust parsing and runtime info)
raw_cors = (settings.CORS_ORIGINS or "").strip()
if raw_cors == "*" or raw_cors == "":
    cors_origins = ["https://verify-x-two.vercel.app"]  # Removed trailing slash
else:
    # split, strip and ignore empty entries
    cors_origins = [o.strip().rstrip('/') for o in raw_cors.split(",") if o.strip()]

# Emit startup info so deployment logs show the effective CORS configuration
print(f"[Startup] CORS allow_origins={cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://verify-x-two\.vercel\.app$",  # Added regex pattern
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Ensure all headers are exposed
)


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0",
    }


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

