import types
import app.services.evidence_service as evidence_service
from app import config
import logging


def test_factcheck_path_sanitized(caplog, monkeypatch):
    # Ensure API key is set
    orig_key = config.settings.FACT_CHECK_API_KEY
    config.settings.FACT_CHECK_API_KEY = "SECRET-KEY-123"

    # Mock HTTPSConnection
    class DummyResp:
        def __init__(self):
            self.status = 200
        def read(self):
            return b'{}'

    class DummyConn:
        def __init__(self, *args, **kwargs):
            pass
        def request(self, method, path):
            # store path for later inspection
            self._path = path
        def getresponse(self):
            return DummyResp()

    monkeypatch.setattr(evidence_service, 'http', evidence_service.http)
    monkeypatch.setattr('app.services.evidence_service.http.client.HTTPSConnection', lambda *a, **k: DummyConn())

    caplog.set_level(logging.DEBUG)
    try:
        evidence_service._google_fact_check('test claim')
        # Check logs for redacted key
        found = False
        for rec in caplog.records:
            if 'FactCheck request path' in rec.message:
                assert '<REDACTED>' in rec.message
                assert 'SECRET-KEY-123' not in rec.message
                found = True
        assert found, 'Expected sanitized log message not found'
    finally:
        config.settings.FACT_CHECK_API_KEY = orig_key
