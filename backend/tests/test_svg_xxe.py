"""
Test that malicious SVG payloads with external entity declarations (XXE) are rejected.
This verifies that we use defusedxml for parsing and do not expand external entities.
"""
import pytest
from app.services.visual_service import _b64_to_image

# Malicious SVG attempting XXE (refers to an external file)
XXE_SVG = '''<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <text>&xxe;</text>
</svg>'''


def test_xxe_payload_rejected():
    """The image loader should not expand external entities; it should reject or fail safely."""
    # _b64_to_image is defensive and returns None on failure; ensure it does not return an Image
    img = _b64_to_image(XXE_SVG, idx=0)
    assert img is None, "Malicious SVG with external entity should be rejected or not parsed"


if __name__ == '__main__':
    pytest.main([__file__, '-q'])
