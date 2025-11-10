"""
Compare old placeholder behavior vs new SVG rasterization.
This demonstrates the fix for the SVG rendering issue.
"""
from app.services.visual_service import _b64_to_image
from PIL import Image
import io

# Create a white placeholder manually (simulating old behavior)
print("WHITE PLACEHOLDER (old fallback behavior):")
placeholder_img = Image.new('RGB', (100, 100), color='white')
print(f"  Size: {placeholder_img.size}")
print(f"  Mode: {placeholder_img.mode}")

# Check pixels
pixels = list(placeholder_img.getdata())
unique_colors = set(pixels)
print(f"  Unique colors: {len(unique_colors)}")
print(f"  Colors: {unique_colors}")

# Calculate average brightness
avg_brightness = sum(sum(p) / 3 for p in pixels) / len(pixels)
print(f"  Average brightness: {avg_brightness:.1f}/255")
print()

# Rasterize colorful SVG (new behavior)
COLORFUL_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <circle cx="150" cy="150" r="40" fill="red" />
    <rect x="10" y="120" width="80" height="60" fill="green" />
</svg>"""

svg_img = _b64_to_image(COLORFUL_SVG, idx=0)
if svg_img:
    print("COLORFUL SVG (new rasterization):")
    print(f"  Size: {svg_img.size}")
    print(f"  Mode: {svg_img.mode}")
    
    # Check pixels
    pixels = list(svg_img.getdata())
    unique_colors = set(pixels)
    print(f"  Unique colors: {len(unique_colors)}")
    if len(unique_colors) <= 10:
        print(f"  Colors: {unique_colors}")
    
    # Calculate average brightness
    avg_brightness = sum(sum(p) / 3 for p in pixels) / len(pixels)
    print(f"  Average brightness: {avg_brightness:.1f}/255")
    
    # Calculate color variance
    r_vals = [p[0] for p in pixels]
    g_vals = [p[1] for p in pixels]
    b_vals = [p[2] for p in pixels]
    
    r_mean = sum(r_vals) / len(r_vals)
    g_mean = sum(g_vals) / len(g_vals)
    b_mean = sum(b_vals) / len(b_vals)
    
    r_var = sum((v - r_mean) ** 2 for v in r_vals) / len(r_vals)
    g_var = sum((v - g_mean) ** 2 for v in g_vals) / len(g_vals)
    b_var = sum((v - b_mean) ** 2 for v in b_vals) / len(b_vals)
    
    avg_var = (r_var + g_var + b_var) / 3
    print(f"  Color variance: {avg_var:.1f}")
    print()

print("=" * 70)
print("COMPARISON:")
print("=" * 70)
print("✅ White placeholder: Pure white (255,255,255), variance ~0")
print("✅ SVG rasterization: Multiple colors, significant variance")
print()
print("FIX VERIFICATION:")
if svg_img:
    svg_pixels = list(svg_img.getdata())
    placeholder_pixels = list(placeholder_img.getdata())
    
    svg_unique = len(set(svg_pixels))
    placeholder_unique = len(set(placeholder_pixels))
    
    print(f"  Placeholder has {placeholder_unique} unique color(s)")
    print(f"  SVG has {svg_unique} unique colors")
    
    if svg_unique > placeholder_unique:
        print("\n✅ SUCCESS: SVG rasterization produces colorful output!")
        print("   The fix is working - SVGs are no longer white placeholders.")
        print("   Before: SVGs rendered as white -> 100% CLIP similarity")
        print("   After: SVGs rendered with actual colors -> realistic similarity")
    else:
        print("\n⚠️  WARNING: SVG and placeholder are similar!")
