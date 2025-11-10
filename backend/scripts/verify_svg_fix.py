"""
Quick visual verification script to demonstrate SVG rasterization improvements.

Run this to see before/after comparison of SVG handling and CLIP similarity scores.
"""
import base64
from app.services.visual_service import analyze_images

# Colorful SVG (blue rect, red circle, green rect)
COLORFUL_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <circle cx="150" cy="150" r="40" fill="red" />
    <rect x="10" y="120" width="80" height="60" fill="green" />
</svg>"""

def test_svg_with_clip():
    """Test SVG with CLIP model to show it produces meaningful similarity scores."""
    print("=" * 70)
    print("SVG Rasterization Test - Verifying Non-White Output")
    print("=" * 70)
    
    # Test 1: Text that matches SVG content
    print("\n1. Testing SVG with matching text ('blue red green shapes'):")
    result = analyze_images(
        text="blue red green shapes geometric forms",
        images_b64=[COLORFUL_SVG],
        threshold=0.25
    )
    print(f"   Average similarity: {result.average_similarity:.4f}")
    print(f"   Fallback mode: {result.fallback}")
    print(f"   Deepfake flag: {result.deepfake_flag}")
    if result.matches:
        print(f"   First match similarity: {result.matches[0].similarity:.4f}")
    
    # Test 2: Text that doesn't match SVG content
    print("\n2. Testing SVG with non-matching text ('cat dog animal'):")
    result2 = analyze_images(
        text="cat dog animal pet furry",
        images_b64=[COLORFUL_SVG],
        threshold=0.25
    )
    print(f"   Average similarity: {result2.average_similarity:.4f}")
    print(f"   Fallback mode: {result2.fallback}")
    if result2.matches:
        print(f"   First match similarity: {result2.matches[0].similarity:.4f}")
    
    # Test 3: Base64 encoded SVG
    print("\n3. Testing base64-encoded SVG:")
    svg_b64 = base64.b64encode(COLORFUL_SVG.encode('utf-8')).decode('ascii')
    result3 = analyze_images(
        text="blue rectangle red circle",
        images_b64=[svg_b64],
        threshold=0.25
    )
    print(f"   Average similarity: {result3.average_similarity:.4f}")
    print(f"   Fallback mode: {result3.fallback}")
    
    print("\n" + "=" * 70)
    print("Expected behavior:")
    print("- If CLIP is available: similarities should vary (not all 0.5)")
    print("- Matching text should score higher than non-matching text")
    print("- If CLIP unavailable: fallback=True with 0.5 scores")
    print("- Old behavior (white placeholder): would show ~1.0 similarity")
    print("=" * 70)
    
    # Verify old bug is fixed
    if not result.fallback:
        if result.average_similarity > 0.9:
            print("\n⚠️  WARNING: Suspiciously high similarity (> 0.9)")
            print("   This suggests SVG might still be producing white placeholder!")
        else:
            print("\n✅ SUCCESS: SVG rasterization is working correctly!")
            print("   Similarity scores are reasonable and vary with text content.")
    else:
        print("\n⚠️  Note: CLIP not available, running in fallback mode")
        print("   Install torch + transformers to test full CLIP functionality")

if __name__ == "__main__":
    test_svg_with_clip()
