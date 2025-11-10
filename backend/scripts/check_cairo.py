"""Check whether Cairo native runtime and cairosvg are available.

This prints a concise summary and exit code:
 - 0: cairosvg + native cairo available
 - 1: cairosvg missing
 - 2: cairosvg present but native cairo missing or rasterization failed
"""
import sys
import logging
logger = logging.getLogger("check_cairo")
logging.basicConfig(level=logging.INFO)

try:
    import cairosvg
except ImportError:
    logger.error("cairosvg is not installed. Install with: pip install cairosvg")
    sys.exit(1)

try:
    tiny_svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="white"/></svg>'
    out = cairosvg.svg2png(bytestring=tiny_svg)
    if out and len(out) > 0:
        logger.info("cairosvg + native cairo: OK")
        sys.exit(0)
    else:
        logger.error("cairosvg ran but produced no output")
        sys.exit(2)
except OSError as ose:
    logger.error("cairosvg failed due to native cairo missing: %s", str(ose))
    logger.error("Install instructions: Linux (Debian/Ubuntu): sudo apt-get install libcairo2 libcairo2-dev; macOS: brew install cairo; Windows: use MSYS2 or install GTK runtime")
    sys.exit(2)
except Exception as e:
    logger.error("cairosvg failed to rasterize SVG: %s", str(e))
    sys.exit(2)
