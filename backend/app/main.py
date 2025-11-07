from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes.linguistic import router as linguistic_router
from .routes.evidence import router as evidence_router
from .routes.visual import router as visual_router
from .routes.synth import router as synth_router


app = FastAPI(title=settings.app_name)

# Allow CORS for local dev and extension
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health")
def health():
	return {"status": "ok", "env": settings.environment}


# Include routers
app.include_router(linguistic_router)
app.include_router(evidence_router)
app.include_router(visual_router)
app.include_router(synth_router)

