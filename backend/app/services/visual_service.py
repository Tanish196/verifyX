import base64
import re
import io
import time
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any, TypeVar, Type, TYPE_CHECKING, Union, cast

# Import types for type checking only
if TYPE_CHECKING:
    from PIL import Image as PILImage
    from transformers import CLIPProcessor, CLIPModel

from app.models.visual import VisualResponse, ImageMatch

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model and cache configuration
MODEL_NAME = "openai/clip-vit-base-patch32"
CACHE_DIR = str(Path("~/.cache/verifyx").expanduser())
MAX_IMAGE_SIZE = (1024, 1024)

# Globals (populated lazily)
_model: Optional['CLIPModel'] = None
_processor: Optional['CLIPProcessor'] = None
_device: str = 'cpu'
os.makedirs(CACHE_DIR, exist_ok=True)

# Note: Heavy imports (torch, transformers, PIL) are now lazy-loaded
# They will only be imported when first needed via _get_clip_dependencies()

# Cairo / cairosvg availability flag (set at import time)
CAIRO_AVAILABLE: Optional[bool] = None

# Secure XML parsing: prefer defusedxml to protect against XXE/DTD attacks.
try:
    from defusedxml import ElementTree as DefusedET  # type: ignore
    DEFUSEDXML_AVAILABLE: bool = True
except Exception:
    DefusedET = None  # type: ignore
    DEFUSEDXML_AVAILABLE = False

def _detect_cairo_available() -> bool:
    """Return True when cairosvg + native cairo are usable, False otherwise.

    The result is cached in the module-level CAIRO_AVAILABLE flag.
    """
    global CAIRO_AVAILABLE
    if CAIRO_AVAILABLE is not None:
        return CAIRO_AVAILABLE

    try:
        import cairosvg  # type: ignore
        tiny_svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>'
        try:
            cairosvg.svg2png(bytestring=tiny_svg)
            CAIRO_AVAILABLE = True
        except OSError as ose:
            logger.warning("cairosvg present but native cairo libs missing: %s", str(ose))
            CAIRO_AVAILABLE = False
        except Exception:
            CAIRO_AVAILABLE = False
    except ImportError:
        CAIRO_AVAILABLE = False

    # If not available, log a single concise install hint
    if not CAIRO_AVAILABLE:
        logger.warning(
            "Cairo runtime not found. To enable SVG support: Windows: install GTK runtime; macOS: `brew install cairo`; Linux: `sudo apt-get install libcairo2 libcairo2-dev`"
        )

    return CAIRO_AVAILABLE

def can_rasterize_svg() -> bool:
    """Backward-compatible alias to check whether SVG rasterization is possible."""
    return _detect_cairo_available()


# Log availability at import time (once)
try:
    available = can_rasterize_svg()
    if available:
        logger.info("SVG rasterization available (cairosvg + native cairo detected)")
    else:
        logger.warning("SVG rasterization not available; SVG inputs will be skipped or fallback")
except Exception:
    # Do not let import-time checks crash the app
    logger.warning("Failed to determine SVG rasterization availability")


@lru_cache(maxsize=1)
def _get_clip_dependencies():
    """
    Lazy-load CLIP dependencies (torch, transformers, PIL).
    Cached to import only once.
    """
    try:
        logger.info("[LAZY LOAD] Importing CLIP dependencies (torch, transformers, PIL)...")
        start = time.time()
        import torch
        from PIL import Image as PILImage, ImageFile
        from transformers import CLIPProcessor, CLIPModel
        elapsed = time.time() - start
        logger.info(f"[LAZY LOAD] CLIP dependencies loaded in {elapsed:.2f}s")
        return torch, PILImage, ImageFile, CLIPProcessor, CLIPModel, True
    except ImportError as e:
        logger.warning(f"CLIP dependencies not available: {e}")
        return None, None, None, None, None, False


@lru_cache(maxsize=1)
def _load_clip(model_name: str = MODEL_NAME, device: Optional[str] = None) -> Tuple[bool, str]:
    """
    Lazy-load CLIP model and processor. Called only on first use, then cached.
    
    Args:
        model_name: Name of the CLIP model to load
        device: Optional device ('cuda' or 'cpu'). Auto-detects if None.
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    global _model, _processor, _device
    
    if _model is not None and _processor is not None:
        return True, "Models already loaded"
    
    # Lazy-load dependencies
    torch, PILImage, ImageFile, CLIPProcessor, CLIPModel, deps_available = _get_clip_dependencies()
    
    if not deps_available:
        return False, "CLIP dependencies not available"
    
    # Check if CLIP should be used
    try:
        from app.config import settings
        if not getattr(settings, 'ENABLE_TORCH', True):
            logger.info("ENABLE_TORCH=False, skipping CLIP load")
            return False, "CLIP disabled via config"
    except:
        pass
    
    try:
        # Determine device
        if device is None:
            _device = 'cuda' if torch.cuda.is_available() else 'cpu'  # type: ignore[union-attr]
        else:
            _device = device if device in ['cuda', 'cpu'] else 'cpu'
        
        logger.info(f"[LAZY LOAD] Loading CLIP model '{model_name}' on {_device}...")
        start = time.time()
        
        # Load model and move to device
        _model = CLIPModel.from_pretrained(model_name, cache_dir=CACHE_DIR)  # type: ignore[union-attr]
        _model = _model.to(_device)  # type: ignore[union-attr]
        _model.eval()  # Set to evaluation mode  # type: ignore[union-attr]
        
        _processor = CLIPProcessor.from_pretrained(model_name, cache_dir=CACHE_DIR)  # type: ignore[union-attr]
        
        elapsed = time.time() - start
        logger.info(f"[LAZY LOAD] CLIP model loaded in {elapsed:.2f}s")
        return True, f"Models loaded on {_device}"
        
    except Exception as e:
        error_msg = f"Failed to load CLIP model: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _model, _processor = None, None
        return False, error_msg


def _b64_to_image(b64: str, idx: Optional[int] = None) -> Optional[Any]:
    """
    Convert base64 encoded image to PIL Image with validation.
    
    Args:
        b64: Base64 encoded image string, optionally with data URI prefix
        
    Returns:
        PIL Image object or None if conversion fails
    """
    # Lazy-load PIL dependencies
    _, PILImage_module, _, _, _, deps_available = _get_clip_dependencies()
    if not deps_available or PILImage_module is None:
        logger.warning("Pillow (PIL) is not available")
        return None
        
    if not b64 or not isinstance(b64, str):
        logger.warning("Invalid base64 input")
        return None
    
    def _fix_padding(s: str) -> str:
        """Pad base64 string to a multiple of 4 characters."""
        if not isinstance(s, str) or len(s) == 0:
            return s
        s = s.strip()
        # remove whitespace
        s = re.sub(r'\s+', '', s)
        missing = (4 - (len(s) % 4)) % 4
        if missing:
            s += '=' * missing
        return s

    def _fetch_url_bytes(url: str) -> Optional[bytes]:
        """Fetch bytes for http/https URL; return None on failure."""
        try:
            import requests
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            logger.warning(f"Failed to fetch image URL at index {idx if idx is not None else '?'}; url={url[:200]}: {e}")
            return None

    def _create_svg_placeholder() -> Optional[bytes]:
        """Return a minimal 100x100 white PNG as bytes (fallback for SVGs)."""
        try:
            from PIL import Image
            # Create a simple white square
            img = Image.new('RGB', (100, 100), color='white')
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            return buf.getvalue()
        except Exception as e:
            logger.warning(f"Failed to create SVG placeholder: {e}")
            return None

    def _rasterize_svg_bytes(svg_bytes: bytes) -> Optional[tuple]:
        """Try to rasterize SVG bytes to PNG using cairosvg, then svglib/reportlab, then PIL, finally placeholder.

        This function logs which renderer was used for each call.
        """
        renderer_used = None
        # Try cairosvg first (best quality if native cairo available)
        if CAIRO_AVAILABLE:
            try:
                import cairosvg
                out = cairosvg.svg2png(bytestring=svg_bytes)
                renderer_used = 'cairosvg'
                logger.info(f"SVG rasterized using cairosvg at index {idx if idx is not None else '?'}")
                return out, renderer_used
            except Exception as e:
                short = (str(svg_bytes)[:200] + '...') if len(svg_bytes) > 200 else str(svg_bytes)
                logger.warning(
                    f"cairosvg failed at index {idx if idx is not None else '?'}; preview='{short}': {e}"
                )
                # Fall through to next fallback

        # Try svglib + reportlab if available (may still depend on native libs)
        try:
            try:
                from svglib.svglib import svg2rlg  # type: ignore
                from reportlab.graphics import renderPM  # type: ignore
            except Exception:
                raise
            import tempfile
            import os
            # svglib expects a file path; write to a temp file
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.svg', delete=False) as tmp_svg:
                tmp_svg.write(svg_bytes)
                tmp_svg_path = tmp_svg.name
            try:
                drawing = svg2rlg(tmp_svg_path)
                if drawing:
                    png_data = renderPM.drawToString(drawing, fmt='PNG', dpi=72)
                    if png_data and len(png_data) > 100:
                        renderer_used = 'svglib'
                        logger.info(f"SVG rasterized using svglib/reportlab at index {idx if idx is not None else '?'}")
                        data_bytes = png_data if isinstance(png_data, (bytes, bytearray)) else png_data.encode('latin-1')
                        return data_bytes, renderer_used
            finally:
                try:
                    os.unlink(tmp_svg_path)
                except Exception:
                    pass
        except Exception as e:
            # svglib/reportlab not available or failed; log and continue to PIL fallback
            logger.debug(f"svglib/reportlab rasterization unavailable or failed at index {idx if idx is not None else '?'}: {e}")

        # Try simple PIL-based SVG rasterization (pure Python, no native libs needed)
        try:
            # Use defusedxml for safe parsing to avoid XXE/DTD attacks.
            if not DEFUSEDXML_AVAILABLE:
                # Do not fall back to the insecure stdlib parser; refuse to parse SVGs.
                logger.warning(
                    "defusedxml not available: refusing to parse SVG input to avoid XXE vulnerabilities"
                )
                raise RuntimeError("Secure XML parser (defusedxml) not available")

            ET = DefusedET
            from PIL import Image, ImageDraw

            # Parse SVG to extract width, height, and basic shapes using defusedxml
            root = ET.fromstring(svg_bytes.decode('utf-8') if isinstance(svg_bytes, bytes) else svg_bytes)  # type: ignore[union-attr]
            
            # Get SVG dimensions (with defaults)
            svg_width = root.get('width', '200')
            svg_height = root.get('height', '200')
            
            # Handle various dimension formats (px, pt, plain numbers)
            def parse_dimension(dim_str: str, default: int = 200) -> int:
                try:
                    # Remove units and convert to int
                    dim_clean = ''.join(c for c in str(dim_str) if c.isdigit() or c == '.')
                    if dim_clean:
                        return int(float(dim_clean))
                except Exception:
                    pass
                return default
            
            width = parse_dimension(svg_width, 200)
            height = parse_dimension(svg_height, 200)
            
            # Limit size to reasonable bounds
            max_dim = 800
            if width > max_dim or height > max_dim:
                scale = max_dim / max(width, height)
                width = int(width * scale)
                height = int(height * scale)
            
            # Create image with white background
            img = Image.new('RGB', (width, height), color='white')
            draw = ImageDraw.Draw(img)
            
            # Parse viewBox for coordinate scaling if present
            viewbox = root.get('viewBox')
            scale_x = scale_y = 1.0
            offset_x = offset_y = 0.0
            
            if viewbox:
                try:
                    vb_parts = viewbox.split()
                    if len(vb_parts) == 4:
                        vb_x, vb_y, vb_w, vb_h = map(float, vb_parts)
                        offset_x, offset_y = -vb_x, -vb_y
                        scale_x = width / vb_w if vb_w > 0 else 1.0
                        scale_y = height / vb_h if vb_h > 0 else 1.0
                except Exception:
                    pass
            
            def transform_coord(x: float, y: float) -> tuple:
                """Transform SVG coordinates to image coordinates."""
                return (
                    int((x + offset_x) * scale_x),
                    int((y + offset_y) * scale_y)
                )
            
            def parse_color(color_str: str) -> Optional[tuple]:
                """Parse SVG color to RGB tuple."""
                if not color_str or color_str == 'none':
                    return None
                color_str = color_str.strip().lower()
                
                # Handle named colors
                named_colors = {
                    'red': (255, 0, 0), 'green': (0, 128, 0), 'blue': (0, 0, 255),
                    'black': (0, 0, 0), 'white': (255, 255, 255), 'yellow': (255, 255, 0),
                    'orange': (255, 165, 0), 'purple': (128, 0, 128), 'pink': (255, 192, 203),
                    'cyan': (0, 255, 255), 'gray': (128, 128, 128), 'brown': (165, 42, 42)
                }
                if color_str in named_colors:
                    return named_colors[color_str]
                
                # Handle hex colors
                if color_str.startswith('#'):
                    hex_color = color_str[1:]
                    if len(hex_color) == 3:
                        hex_color = ''.join([c*2 for c in hex_color])
                    if len(hex_color) == 6:
                        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
                
                # Handle rgb() format
                if color_str.startswith('rgb'):
                    nums = ''.join(c if c.isdigit() or c == ',' else ' ' for c in color_str)
                    parts = [int(p.strip()) for p in nums.split(',') if p.strip()]
                    if len(parts) >= 3:
                        return tuple(parts[:3])
                
                return (128, 128, 128)  # Default gray
            
            # Extract namespace if present
            ns = {'svg': 'http://www.w3.org/2000/svg'}
            
            # Draw rectangles
            for rect in root.findall('.//{http://www.w3.org/2000/svg}rect') + root.findall('.//rect'):
                try:
                    x = float(rect.get('x', 0))
                    y = float(rect.get('y', 0))
                    w = float(rect.get('width', 0))
                    h = float(rect.get('height', 0))
                    fill = parse_color(rect.get('fill', 'black'))
                    
                    if fill and w > 0 and h > 0:
                        x1, y1 = transform_coord(x, y)
                        x2, y2 = transform_coord(x + w, y + h)
                        draw.rectangle([x1, y1, x2, y2], fill=fill)
                except Exception:
                    pass
            
            # Draw circles
            for circle in root.findall('.//{http://www.w3.org/2000/svg}circle') + root.findall('.//circle'):
                try:
                    cx = float(circle.get('cx', 0))
                    cy = float(circle.get('cy', 0))
                    r = float(circle.get('r', 0))
                    fill = parse_color(circle.get('fill', 'black'))
                    
                    if fill and r > 0:
                        x1, y1 = transform_coord(cx - r, cy - r)
                        x2, y2 = transform_coord(cx + r, cy + r)
                        draw.ellipse([x1, y1, x2, y2], fill=fill)
                except Exception:
                    pass
            
            # Draw ellipses
            for ellipse in root.findall('.//{http://www.w3.org/2000/svg}ellipse') + root.findall('.//ellipse'):
                try:
                    cx = float(ellipse.get('cx', 0))
                    cy = float(ellipse.get('cy', 0))
                    rx = float(ellipse.get('rx', 0))
                    ry = float(ellipse.get('ry', 0))
                    fill = parse_color(ellipse.get('fill', 'black'))
                    
                    if fill and rx > 0 and ry > 0:
                        x1, y1 = transform_coord(cx - rx, cy - ry)
                        x2, y2 = transform_coord(cx + rx, cy + ry)
                        draw.ellipse([x1, y1, x2, y2], fill=fill)
                except Exception:
                    pass
            
            # Draw polygons
            for polygon in root.findall('.//{http://www.w3.org/2000/svg}polygon') + root.findall('.//polygon'):
                try:
                    points_str = polygon.get('points', '')
                    fill = parse_color(polygon.get('fill', 'black'))
                    
                    if fill and points_str:
                        # Parse points
                        coords = []
                        nums = [float(n) for n in points_str.replace(',', ' ').split() if n]
                        for i in range(0, len(nums) - 1, 2):
                            coords.append(transform_coord(nums[i], nums[i + 1]))
                        
                        if len(coords) >= 3:
                            draw.polygon(coords, fill=fill)
                except Exception:
                    pass
            
            # Convert to PNG bytes
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            png_bytes = buf.getvalue()
            
            if png_bytes and len(png_bytes) > 100:
                renderer_used = 'pillow'
                logger.info(f"SVG rasterized using PIL-based renderer at index {idx if idx is not None else '?'}")
                return png_bytes, renderer_used
                
        except Exception as e:
            # If defusedxml explicitly blocked the XML (e.g. EntitiesForbidden), refuse to process the SVG
            try:
                # defusedxml defines DefusedXmlException and specific subclasses like EntitiesForbidden
                if DEFUSEDXML_AVAILABLE:
                    from defusedxml.common import DefusedXmlException  # type: ignore
                    if isinstance(e, DefusedXmlException):
                        logger.warning(
                            "DefusedXML blocked unsafe XML content; rejecting SVG at index %s: %s",
                            idx if idx is not None else '?', str(e)
                        )
                        return None
            except Exception:
                # If we cannot import defusedxml.common for any reason, fall through to placeholder path
                pass

            logger.warning(f"PIL-based SVG fallback failed at index {idx if idx is not None else '?'}: {e}")

            # Last resort: white placeholder
            renderer_used = 'placeholder'
            logger.info(f"Using white placeholder for SVG at index {idx if idx is not None else '?'}")
            return _create_svg_placeholder(), renderer_used

    try:
        if not isinstance(b64, str) or len(b64.strip()) == 0:
            logger.warning(f"Invalid image input at index {idx if idx is not None else '?'}")
            return None

        s = b64.strip()

        # Raw SVG/XML input (direct SVG string)
        if s.lstrip().startswith('<') and (s.lstrip().startswith('<svg') or s.lstrip().startswith('<?xml')):
            svg_bytes = s.encode('utf-8')
            res = _rasterize_svg_bytes(svg_bytes)
            if not res:
                logger.warning(f"Failed to process SVG at index {idx if idx is not None else '?'}")
                return None
            # res is (bytes, renderer)
            if isinstance(res, tuple):
                data, svg_renderer = res
            else:
                data = res
                svg_renderer = None

        # URL input
        elif re.match(r'^https?://', s, flags=re.IGNORECASE):
            data = _fetch_url_bytes(s)
            if not data:
                logger.warning(f"Failed to decode image at index {idx if idx is not None else '?'}")
                return None

        else:
            # strip data URI if present and attempt base64 decode
            s_clean = re.sub(r'^data:.*;base64,', '', s, flags=re.IGNORECASE)
            s_fixed = _fix_padding(s_clean)
            try:
                data = base64.b64decode(s_fixed, validate=True)
            except Exception:
                try:
                    data = base64.urlsafe_b64decode(s_fixed)
                except Exception as exc:
                    short = (s_fixed[:200] + '...') if len(s_fixed) > 200 else s_fixed
                    logger.warning(
                        f"Failed to decode base64 for image at index {idx if idx is not None else '?'}; preview='{short}': {exc}"
                    )
                    return None

        # At this point `data` should be bytes representing an image (PNG/JPEG/etc.)
        # Open image with size limit
        _, PILImage_module, ImageFile_module, _, _, _ = _get_clip_dependencies()
        if ImageFile_module and hasattr(ImageFile_module, 'LOAD_TRUNCATED_IMAGES'):
            ImageFile_module.LOAD_TRUNCATED_IMAGES = True  # type: ignore[attr-defined]

        try:
            img = PILImage_module.open(io.BytesIO(data)) if PILImage_module else None
            if img is None:
                return None
        except Exception as exc:
            # Maybe the bytes represent an SVG - check if we can rasterize
            txt_preview = data[:200].decode('utf-8', errors='ignore')
            if '<svg' in txt_preview or '<?xml' in txt_preview:
                # Detected SVG content - rasterize or use placeholder
                res = _rasterize_svg_bytes(data)
                if res:
                    if isinstance(res, tuple):
                        png_bytes, svg_renderer = res
                    else:
                        png_bytes = res
                        svg_renderer = None
                    try:
                        img = PILImage.open(io.BytesIO(png_bytes))
                    except Exception as exc2:
                        short = (txt_preview[:200] + '...') if len(txt_preview) > 200 else txt_preview
                        logger.warning(
                            f"PIL cannot identify image at index {idx if idx is not None else '?'} after SVG processing; preview='{short}': {exc2}"
                        )
                        return None
                else:
                    # Failed to create even placeholder
                    logger.warning(f"Failed to process SVG at index {idx if idx is not None else '?'}")
                    return None
            else:
                # Not SVG - legitimate PIL failure
                short = (data[:200].hex() + '...') if isinstance(data, (bytes, bytearray)) else str(data)[:200]
                logger.warning(
                    f"PIL cannot identify image at index {idx if idx is not None else '?'}; preview='{short}': {exc}"
                )
                return None

        # Attach renderer metadata (if any) before returning
        try:
            if 'svg_renderer' in locals() and svg_renderer:
                # Use PIL image.info to store the renderer used
                img.info['renderer'] = svg_renderer
        except Exception:
            pass

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if too large
        if any(dim > max_dim for dim, max_dim in zip(img.size, MAX_IMAGE_SIZE)):
            img.thumbnail(MAX_IMAGE_SIZE, PILImage.Resampling.LANCZOS)

        return img

    except Exception as e:
        # Catch-all to ensure we never raise from malformed input
        short = (str(b64)[:200] + '...') if isinstance(b64, str) and len(b64) > 200 else str(b64)
        logger.error(
            f"Unexpected error processing image at index {idx if idx is not None else '?'}; preview='{short}': {e}",
            exc_info=True
        )
        return None


def analyze_images(
    text: str, 
    images_b64: List[str], 
    threshold: float = 0.25,
    batch_size: int = 8
) -> VisualResponse:
    """
    Analyze images and compare with text using CLIP model.
    
    Args:
        text: Text to compare images against
        images_b64: List of base64 encoded images
        threshold: Similarity threshold for deepfake detection
        batch_size: Number of images to process in each batch
        
    Returns:
        VisualResponse with analysis results
    """
    start_time = time.time()
    matches: List[ImageMatch] = []
    average_similarity = 0.0
    deepfake_flag = False
    fallback = False
    error = None

    # Lazy-load CLIP dependencies
    torch, PILImage, ImageFile, CLIPProcessor, CLIPModel, deps_available = _get_clip_dependencies()
    
    # Initialize models if needed
    if deps_available and (_model is None or _processor is None):
        success, msg = _load_clip()
        if not success:
            logger.warning(f"Using fallback mode: {msg}")
            fallback = True

    # Decode and validate images
    valid_images: List[Any] = []  # Type as Any since PILImage might be None
    if images_b64:
        for i, img_b64 in enumerate(images_b64):
            img = _b64_to_image(img_b64, idx=i)
            if img:
                valid_images.append(img)
            else:
                logger.warning(f"Failed to decode image at index {i}")
    
    # Process with CLIP if available and we have valid images
    if not fallback and _model is not None and _processor is not None and valid_images and torch is not None:
        try:
            all_sims = []
            
            # Process in batches
            for i in range(0, len(valid_images), batch_size):
                batch_images = valid_images[i:i+batch_size]
                
                # Move tensors to the correct device
                inputs = _processor(  # type: ignore[call-arg]
                    text=[text] * len(batch_images),
                    images=batch_images,
                    return_tensors="pt",
                    padding=True,
                    truncation=True,
                    max_length=77,  # CLIP's max length
                    return_overflowing_tokens=False
                )
                if hasattr(inputs, 'to') and _device:
                    inputs = inputs.to(_device)
                
                with torch.no_grad():
                    outputs = _model(**inputs)
                    # Get logits per image and apply sigmoid to get probabilities
                    logits_per_image = outputs.logits_per_image
                    
                    # Handle both single and multi-image cases
                    if logits_per_image.dim() == 0:
                        # Single image case
                        batch_sims = [torch.sigmoid(logits_per_image).item()]
                    else:
                        # Multi-image case - get diagonal elements (image-text pairs)
                        batch_sims = torch.sigmoid(logits_per_image.diagonal()).tolist()
                    
                    all_sims.extend(batch_sims)
            
            # Process results - ensure we have valid similarity scores
            if all_sims and len(valid_images) == len(all_sims):
                for idx, sim in enumerate(all_sims):
                    # Ensure sim is a float and within valid range [0, 1]
                    sim_float = max(0.0, min(1.0, float(sim)))
                    # Attempt to read renderer metadata from the PIL image
                    renderer = None
                    try:
                        renderer = getattr(valid_images[idx], 'info', {}).get('renderer')
                    except Exception:
                        renderer = None
                    matches.append(ImageMatch(index=idx, similarity=sim_float, renderer=renderer))
                
                average_similarity = sum(all_sims) / len(all_sims)
                deepfake_flag = average_similarity < threshold
                
                logger.info(
                    f"Processed {len(valid_images)} images. "
                    f"Avg similarity: {average_similarity:.3f}, "
                    f"Deepfake: {deepfake_flag}"
                )
            else:
                logger.warning(f"Mismatch between valid images ({len(valid_images)}) and similarity scores ({len(all_sims)})")
                # Fallback to default similarity if there's a mismatch
                matches = []
                for i in range(len(valid_images)):
                    renderer = None
                    try:
                        renderer = getattr(valid_images[i], 'info', {}).get('renderer')
                    except Exception:
                        renderer = None
                    matches.append(ImageMatch(index=i, similarity=0.5, notes="fallback", renderer=renderer))
                fallback = True
                error = "No valid similarity scores generated"
                
        except Exception as e:
            fallback = True
            error = str(e)
            logger.error(f"Error during CLIP processing: {error}", exc_info=True)
    else:
        fallback = True
        error = "CLIP not available or no valid images"

    # Fallback to simple heuristics if needed
    if fallback:
        logger.warning(f"Using fallback analysis: {error or 'CLIP not available'}")
        matches = [
            ImageMatch(
                index=i, 
                similarity=0.5, 
                notes="fallback: " + (error or "CLIP not available")
            ) 
            for i in range(len(images_b64 or []))
        ]
        average_similarity = 0.5 if images_b64 else 0.0
        deepfake_flag = False

    # Calculate processing time
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Create response with only the fields defined in VisualResponse model
    return VisualResponse(
        average_similarity=float(average_similarity),
        matches=matches,
        deepfake_flag=deepfake_flag,
        fallback=fallback,
        latency_ms=latency_ms
    )
