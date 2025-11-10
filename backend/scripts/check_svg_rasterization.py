"""Check SVG rasterization capability for the Visual service.

This script attempts to import cairosvg and run a tiny svg->png conversion to
verify that both the Python package and native cairo libraries are available.

Usage:
    python scripts/check_svg_rasterization.py

Exit codes:
    0 - rasterization available
    1 - cairosvg missing
    2 - cairosvg present but native cairo libraries missing / conversion fails
"""
import sys
import logging

logger = logging.getLogger("check_svg_rasterization")
logging.basicConfig(level=logging.INFO)

try:
    import cairosvg
except ImportError:
    logger.error("cairosvg is not installed. Install with: pip install cairosvg")
    sys.exit(1)

tiny_svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="white"/></svg>'
try:
    out = cairosvg.svg2png(bytestring=tiny_svg)
    if out and len(out) > 0:
        logger.info("SVG rasterization OK: cairosvg + native cairo appear to be available.")
        sys.exit(0)
    else:
        logger.error("cairosvg ran but produced no output.")
        sys.exit(2)
except OSError as ose:
    logger.error("cairosvg failed due to missing native cairo libraries: %s", str(ose))
    logger.error("On Debian/Ubuntu: sudo apt-get install libcairo2 libcairo2-dev")
    logger.error("On macOS: brew install cairo")
    logger.error("On Windows: install GTK or use MSYS2: pacman -S mingw-w64-x86_64-cairo")
    sys.exit(2)
except Exception as e:
    logger.error("cairosvg failed to rasterize SVG: %s", str(e))
    sys.exit(2)
