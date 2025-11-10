"""Test SVG detection and placeholder generation"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.visual_service import _b64_to_image
import base64

# Simple SVG test case
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="red"/>
</svg>'''

print("Testing SVG detection...")
print(f"Cairo available: {os.environ.get('CAIRO_AVAILABLE', 'checking...')}")

# Test 1: Raw SVG string
print("\n1. Testing raw SVG string:")
result = _b64_to_image(svg_content, idx=0)
if result:
    print(f"✓ SVG processed successfully! Image size: {result.size}")
else:
    print("✗ SVG processing failed")

# Test 2: Base64 encoded SVG
print("\n2. Testing base64 encoded SVG:")
svg_b64 = base64.b64encode(svg_content.encode()).decode()
result = _b64_to_image(svg_b64, idx=1)
if result:
    print(f"✓ Base64 SVG processed successfully! Image size: {result.size}")
else:
    print("✗ Base64 SVG processing failed")

# Test 3: Data URI with SVG
print("\n3. Testing data URI SVG:")
data_uri = f"data:image/svg+xml;base64,{svg_b64}"
result = _b64_to_image(data_uri, idx=2)
if result:
    print(f"✓ Data URI SVG processed successfully! Image size: {result.size}")
else:
    print("✗ Data URI SVG processing failed")

print("\n✓ All tests completed!")
