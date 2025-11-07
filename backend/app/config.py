import os
from typing import Optional


class Settings:
	"""Lightweight settings loader without external dependencies."""

	app_name: str = os.getenv("APP_NAME", "verifyX Backend")
	environment: str = os.getenv("ENVIRONMENT", "development")

	# External APIs
	FACT_CHECK_API_KEY: Optional[str] = os.getenv("FACT_CHECK_API_KEY")

	# Feature toggles
	ENABLE_TRANSFORMERS: bool = os.getenv("ENABLE_TRANSFORMERS", "true").lower() == "true"
	ENABLE_TORCH: bool = os.getenv("ENABLE_TORCH", "true").lower() == "true"


settings = Settings()

