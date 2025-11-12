"""
VerifyX - Hugging Face Spaces Entry Point
FastAPI app for content authenticity verification
"""

import os
import uvicorn
from app.main import app

# Hugging Face Spaces runs on port 7860 by default
PORT = int(os.getenv("PORT", 7860))
HOST = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting VerifyX on Hugging Face Spaces")
    print(f"📍 Running on http://{HOST}:{PORT}")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info",
    )
