import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import config

client = TestClient(app)


def test_debug_endpoint_in_production():
    # Temporarily set environment to production
    orig = config.settings.environment
    config.settings.environment = "production"
    try:
        r = client.get("/debug/config")
        assert r.status_code == 404
    finally:
        config.settings.environment = orig


def test_debug_endpoint_requires_token_and_no_key_exposed():
    # Ensure non-production
    orig_env = config.settings.environment
    orig_token = getattr(config.settings, "ADMIN_TOKEN", None)
    config.settings.environment = "development"
    config.settings.ADMIN_TOKEN = "secret-token"

    try:
        # Without token -> 401
        r = client.get("/debug/config")
        assert r.status_code == 401

        # With wrong token
        r = client.get("/debug/config", headers={"X-Internal-Token": "wrong"})
        assert r.status_code == 401

        # With correct token
        r = client.get("/debug/config", headers={"X-Internal-Token": "secret-token"})
        assert r.status_code == 200
        data = r.json()
        assert "fact_check_api_key_present" in data
        # API key must not be present in response
        assert "fact_check_api_key_prefix" not in data
    finally:
        config.settings.environment = orig_env
        config.settings.ADMIN_TOKEN = orig_token
