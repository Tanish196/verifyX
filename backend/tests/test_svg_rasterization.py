"""
Test SVG rasterization with both cairosvg and svglib/reportlab fallbacks.

This test ensures that SVG images are properly converted to PNG and produce
meaningful (non-white) output for CLIP analysis.
"""
import io
import base64
from PIL import Image
import pytest

# Import the service functions we're testing
from app.services.visual_service import _b64_to_image


# Sample colorful SVG for testing (blue rectangle + red circle)
COLORFUL_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <circle cx="150" cy="150" r="40" fill="red" />
    <rect x="10" y="120" width="80" height="60" fill="green" />
</svg>"""

# Simple SVG icon (black star)
SIMPLE_ICON_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <polygon points="50,10 60,40 90,40 65,60 75,90 50,70 25,90 35,60 10,40 40,40" fill="black" />
</svg>"""

# All-white SVG (for baseline comparison)
WHITE_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="white"/>
</svg>"""


def calculate_color_variance(img: Image.Image) -> float:
    """
    Calculate color variance in an image.
    Returns 0.0 for solid white, higher values for colorful images.
    """
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    pixels = list(img.getdata())
    if not pixels:
        return 0.0
    
    # Calculate variance of pixel values
    r_vals = [p[0] for p in pixels]
    g_vals = [p[1] for p in pixels]
    b_vals = [p[2] for p in pixels]
    
    r_mean = sum(r_vals) / len(r_vals)
    g_mean = sum(g_vals) / len(g_vals)
    b_mean = sum(b_vals) / len(b_vals)
    
    r_var = sum((v - r_mean) ** 2 for v in r_vals) / len(r_vals)
    g_var = sum((v - g_mean) ** 2 for v in g_vals) / len(g_vals)
    b_var = sum((v - b_mean) ** 2 for v in b_vals) / len(b_vals)
    
    # Average variance across channels
    return (r_var + g_var + b_var) / 3


def is_mostly_white(img: Image.Image, threshold: float = 240.0) -> bool:
    """
    Check if an image is mostly white.
    Returns True if average pixel value is above threshold (out of 255).
    """
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    pixels = list(img.getdata())
    if not pixels:
        return True
    
    # Calculate average brightness
    avg_brightness = sum(sum(p) / 3 for p in pixels) / len(pixels)
    return avg_brightness > threshold


class TestSVGRasterization:
    """Test suite for SVG rasterization functionality."""
    
    def test_colorful_svg_is_not_white_placeholder(self):
        """Test that a colorful SVG doesn't result in a white placeholder image."""
        # Pass raw SVG string
        result_img = _b64_to_image(COLORFUL_SVG, idx=0)
        
        assert result_img is not None, "SVG rasterization returned None"
        assert isinstance(result_img, Image.Image), "Result should be a PIL Image"
        assert result_img.mode == 'RGB', "Result should be RGB mode"
        
        # Check that the image is NOT mostly white
        assert not is_mostly_white(result_img, threshold=240.0), \
            "Colorful SVG should not produce a mostly-white image"
        
        # Check that there's meaningful color variance
        variance = calculate_color_variance(result_img)
        assert variance > 100.0, \
            f"Colorful SVG should have significant color variance, got {variance:.2f}"
    
    def test_simple_icon_svg(self):
        """Test that a simple icon SVG is rasterized correctly."""
        result_img = _b64_to_image(SIMPLE_ICON_SVG, idx=1)
        
        assert result_img is not None, "SVG rasterization returned None"
        assert isinstance(result_img, Image.Image), "Result should be a PIL Image"
        
        # Icon has black on white/transparent, should have some variance
        variance = calculate_color_variance(result_img)
        assert variance > 10.0, \
            f"Icon SVG should have some color variance, got {variance:.2f}"
    
    def test_white_svg_baseline(self):
        """Test that an all-white SVG is correctly identified as white (baseline test)."""
        result_img = _b64_to_image(WHITE_SVG, idx=2)
        
        assert result_img is not None, "SVG rasterization returned None"
        
        # This SHOULD be mostly white (it's a legitimate white SVG)
        assert is_mostly_white(result_img, threshold=240.0), \
            "All-white SVG should produce a mostly-white image"
    
    def test_base64_encoded_svg(self):
        """Test that base64-encoded SVG data URIs work correctly."""
        # Encode colorful SVG as base64
        svg_b64 = base64.b64encode(COLORFUL_SVG.encode('utf-8')).decode('ascii')
        data_uri = f"data:image/svg+xml;base64,{svg_b64}"
        
        result_img = _b64_to_image(data_uri, idx=3)
        
        assert result_img is not None, "Base64 SVG rasterization returned None"
        assert not is_mostly_white(result_img, threshold=240.0), \
            "Base64-encoded colorful SVG should not produce a white image"
    
    def test_raw_base64_svg(self):
        """Test raw base64 SVG without data URI prefix."""
        svg_b64 = base64.b64encode(COLORFUL_SVG.encode('utf-8')).decode('ascii')
        
        result_img = _b64_to_image(svg_b64, idx=4)
        
        assert result_img is not None, "Raw base64 SVG rasterization returned None"
        # Since the decoder tries base64 first, this might decode but fail to parse as SVG
        # or it might work - either is acceptable as long as it doesn't crash
    
    def test_svg_with_xml_declaration(self):
        """Test SVG with full XML declaration."""
        svg_with_xml = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">
    <rect x="25" y="25" width="100" height="100" fill="purple" />
</svg>"""
        
        result_img = _b64_to_image(svg_with_xml, idx=5)
        
        assert result_img is not None, "SVG with XML declaration returned None"
        assert not is_mostly_white(result_img, threshold=240.0), \
            "Purple SVG should not produce a white image"
    
    def test_image_size_constraints(self):
        """Test that rasterized SVGs respect MAX_IMAGE_SIZE constraints."""
        # Large SVG that should be resized
        large_svg = f"""<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000">
    <rect width="2000" height="2000" fill="orange" />
</svg>"""
        
        result_img = _b64_to_image(large_svg, idx=6)
        
        assert result_img is not None, "Large SVG rasterization returned None"
        
        # Check that image was resized (MAX_IMAGE_SIZE is 1024x1024)
        assert result_img.size[0] <= 1024, "Width should be <= 1024"
        assert result_img.size[1] <= 1024, "Height should be <= 1024"
    
    def test_invalid_svg_graceful_failure(self):
        """Test that invalid SVG input is handled gracefully."""
        invalid_svg = "<svg>This is not valid</svg>"
        
        # Should not crash - either returns a placeholder or None
        result_img = _b64_to_image(invalid_svg, idx=7)
        
        # We accept either None or a placeholder image
        # (implementation detail - both are acceptable failure modes)
        if result_img is not None:
            assert isinstance(result_img, Image.Image), \
                "If result is not None, it should be a PIL Image"


if __name__ == "__main__":
    # Allow running this test file directly
    pytest.main([__file__, "-v"])
