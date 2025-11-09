"""
Configuration management for VerifyX backend.
Uses environment variables with sensible defaults.
"""

import os
import logging
from pathlib import Path
from typing import Optional

# Error handling for .env file -> Load .env file BEFORE defining Settings class
try:
    from dotenv import load_dotenv  # type: ignore
    # .env is at backend/.env (one level above this app/ folder)
    dotenv_path = Path(__file__).resolve().parents[1] / ".env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path)
        print(f"[Config] Loaded .env from {dotenv_path}")
    else:
        print(f"[Config] No .env file found at {dotenv_path}")
except ImportError:
    print("[Config] python-dotenv not installed, skipping .env loading")
except Exception as e:
    print(f"[Config] Error loading .env: {e}")

class Settings:
    """
    Application settings loaded from environment variables.
    
    Attributes:
        app_name: Name of the application
        environment: Deployment environment (development, staging, production)
        debug: Enable debug mode
        FACT_CHECK_API_KEY: Google Fact Check API key
        ENABLE_TRANSFORMERS: Enable ML transformer models
        ENABLE_TORCH: Enable PyTorch operations
        CORS_ORIGINS: Allowed CORS origins
        MAX_TEXT_LENGTH: Maximum allowed text length for analysis
        MAX_IMAGES: Maximum number of images to process
    """

    app_name: str = os.getenv("APP_NAME", "VerifyX Backend")
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # External APIs
    FACT_CHECK_API_KEY: Optional[str] = os.getenv("FACT_CHECK_API_KEY")

    # Feature toggles
    ENABLE_TRANSFORMERS: bool = os.getenv("ENABLE_TRANSFORMERS", "true").lower() == "true"
    ENABLE_TORCH: bool = os.getenv("ENABLE_TORCH", "true").lower() == "true"
    
    # CORS settings
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    
    # Processing limits
    MAX_TEXT_LENGTH: int = int(os.getenv("MAX_TEXT_LENGTH", "10000"))
    MAX_IMAGES: int = int(os.getenv("MAX_IMAGES", "10"))
    
    # Model cache directory
    CACHE_DIR: str = os.getenv("CACHE_DIR", str(os.path.expanduser("~/.cache/verifyx")))


settings = Settings()

# Log whether FACT_CHECK_API_KEY is present to aid debugging at startup
# print(f"[Config] FACT_CHECK_API_KEY present: {bool(settings.FACT_CHECK_API_KEY)}")
# if settings.FACT_CHECK_API_KEY:
#     print(f"[Config] API Key (first 10 chars): {settings.FACT_CHECK_API_KEY[:10]}...")
# else:
#     print("[Config] WARNING: No FACT_CHECK_API_KEY found - evidence service will use mock fallback")

