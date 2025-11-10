"""Debug script to inspect SVG rasterization output."""
from app.services.visual_service import _b64_to_image
from PIL import Image

COLORFUL_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect x="10" y="10" width="80" height="80" fill="blue" />
    <circle cx="150" cy="150" r="40" fill="red" />
    <rect x="10" y="120" width="80" height="60" fill="green" />
</svg>"""

img = _b64_to_image(COLORFUL_SVG, idx=0)
if img:
    print(f"Image size: {img.size}")
    print(f"Image mode: {img.mode}")
    
    # Sample some pixels
    pixels = list(img.getdata())
    print(f"\nTotal pixels: {len(pixels)}")
    
    # Check corners and center
    w, h = img.size
    print(f"\nPixel samples:")
    print(f"  Top-left (0,0): {img.getpixel((0, 0))}")
    print(f"  Top-right ({w-1},0): {img.getpixel((w-1, 0))}")
    print(f"  Center ({w//2},{h//2}): {img.getpixel((w//2, h//2))}")
    print(f"  Bottom-left (0,{h-1}): {img.getpixel((0, h-1))}")
    
    # Check specific areas where shapes should be
    print(f"\nShape areas:")
    print(f"  Blue rect area (50,50): {img.getpixel((50, 50))}")
    print(f"  Red circle area (150,150): {img.getpixel((150, 150))}")
    print(f"  Green rect area (50,150): {img.getpixel((50, 150))}")
    
    # Calculate color statistics
    unique_colors = set(pixels)
    print(f"\nUnique colors found: {len(unique_colors)}")
    if len(unique_colors) <= 10:
        print(f"Colors: {unique_colors}")
    
    # Save for inspection
    img.save('debug_svg_output.png')
    print(f"\nSaved image to: debug_svg_output.png")
else:
    print("Failed to rasterize SVG!")
