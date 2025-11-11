"""
VerifyX FastAPI Backend
Multi-agent AI verification system for content authenticity.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.routes.linguistic import router as linguistic_router
from app.routes.evidence import router as evidence_router
from app.routes.visual import router as visual_router
from app.routes.synth import router as synth_router
from fastapi import Request, HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-agent AI system for verifying content authenticity",
    version="1.0.0",
    debug=settings.debug,
)

@app.on_event("startup")
async def startup_event():
    """Log startup configuration and ready status."""
    logger.info("=" * 60)
    logger.info("VerifyX Backend Starting")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"CORS: Enabled for Vercel + localhost")
    logger.info(f"Lazy Loading: Enabled (models load on first request)")
    logger.info(f"Warmup endpoint: /warmup (call after deployment)")
    logger.info("=" * 60)
    logger.info("Server ready - awaiting requests")
    logger.info("=" * 60)

# === CORS CONFIGURATION FOR RENDER + VERCEL ===
# Configure CORS to allow requests from Vercel frontend and local development
print(f"[Startup] Environment: {settings.environment}")
print(f"[Startup] Configured CORS for Render + Vercel")
print(f"[Startup] Lazy loading enabled for NLP and CLIP")

allowed_origins = [
    "https://verify-x-two.vercel.app",  # Production frontend (Vercel)
    "http://localhost:3000",            # Local dev (Next.js)
    "http://127.0.0.1:3000",            # Local dev (alternative)
    "http://localhost:5173",            # Local dev (Vite)
    "*",                                # Fallback for Render proxy
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # Allow credentials for authenticated requests
    allow_methods=["*"],     # Allow all HTTP methods
    allow_headers=["*"],     # Allow all headers
    expose_headers=["*"],    # Expose all headers to frontend
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


@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """
    Handle CORS preflight OPTIONS requests for all routes.
    Ensures preflight requests return 200 OK.
    """
    return {"status": "ok"}


@app.get("/wake")
def wake():
    """Lightweight wake endpoint for cold starts."""
    return {"status": "awake"}


@app.get("/warmup")
async def warmup():
    """
    Warmup endpoint to preload all lazy-loaded models on startup.
    Call this immediately after deployment to avoid 502 errors on first user request.
    
    Recommended Render start command:
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
    
    Then call via:
    curl -s https://verifyx-2kqa.onrender.com/warmup
    
    Or use Render's post-deploy hook.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    results = {
        "status": "loading",
        "linguistic": "not loaded",
        "visual": "not loaded",
        "errors": []
    }
    
    # Preload linguistic service models (transformers, torch)
    try:
        from app.services import linguistic_service
        logger.info("[WARMUP] Preloading linguistic models...")
        
        # Trigger lazy load by calling the load function
        success, msg = linguistic_service._load_models()
        if success:
            results["linguistic"] = "loaded"
            logger.info("[WARMUP] Linguistic models loaded successfully")
        else:
            results["linguistic"] = f"failed: {msg}"
            results["errors"].append(f"Linguistic: {msg}")
            logger.warning(f"[WARMUP] Linguistic models failed: {msg}")
    except Exception as e:
        results["linguistic"] = f"error: {str(e)}"
        results["errors"].append(f"Linguistic error: {str(e)}")
        logger.error(f"[WARMUP] Linguistic error: {e}", exc_info=True)
    
    # Preload visual service models (CLIP, PIL)
    try:
        from app.services import visual_service
        logger.info("[WARMUP] Preloading visual models...")
        
        # Trigger lazy load by calling the load function
        success, msg = visual_service._load_clip()
        if success:
            results["visual"] = "loaded"
            logger.info("[WARMUP] Visual models loaded successfully")
        else:
            results["visual"] = f"failed: {msg}"
            results["errors"].append(f"Visual: {msg}")
            logger.warning(f"[WARMUP] Visual models failed: {msg}")
    except Exception as e:
        results["visual"] = f"error: {str(e)}"
        results["errors"].append(f"Visual error: {str(e)}")
        logger.error(f"[WARMUP] Visual error: {e}", exc_info=True)
    
    # Set overall status
    if results["linguistic"] == "loaded" and results["visual"] == "loaded":
        results["status"] = "models loaded"
        logger.info("[WARMUP] ✅ All models preloaded successfully")
    elif results["errors"]:
        results["status"] = "error"
        logger.warning(f"[WARMUP] ⚠️ Warmup completed with errors: {results['errors']}")
    else:
        results["status"] = "partial"
        logger.warning("[WARMUP] ⚠️ Some models failed to load")
    
    return results


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

