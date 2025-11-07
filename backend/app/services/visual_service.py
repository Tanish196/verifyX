import base64
import io
import time
import logging
import os
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any, TypeVar, Type, TYPE_CHECKING, Union, cast

# Import types for type checking only
if TYPE_CHECKING:
    from PIL import Image as PILImage
    from transformers import CLIPProcessor, CLIPModel

from app.models.visual import VisualResponse, ImageMatch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL_NAME = "openai/clip-vit-base-patch32"
CACHE_DIR = str(Path("~/.cache/verifyx").expanduser())
MAX_IMAGE_SIZE = (1024, 1024)  # Max dimensions for image processing

# Initialize globals with type hints
_model = None  # type: Optional['CLIPModel']
_processor = None  # type: Optional['CLIPProcessor']
_device: str = 'cpu'  # Will be updated after torch import

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# Check for dependencies
_HAS_CLIP = False
try:
    import torch  # type: ignore
    from PIL import Image as PILImage, ImageFile  # type: ignore
    from transformers import CLIPProcessor, CLIPModel  # type: ignore
    
    # Set default device after torch import
    _device = 'cuda' if torch.cuda.is_available() else 'cpu'
    _HAS_CLIP = True
    
    # Create type alias for PIL Image
    Image = PILImage.Image  # type: Type[PILImage.Image]
    
except ImportError as e:
    logger.warning(f"Required dependencies not found: {e}")
    # Create dummy types for type checking
    class DummyType:
        pass
    
    Image = ImageFile = CLIPModel = CLIPProcessor = DummyType  # type: ignore


def _load_clip(model_name: str = MODEL_NAME, device: Optional[str] = None) -> Tuple[bool, str]:
    """
    Load CLIP model and processor.
    
    Args:
        model_name: Name of the CLIP model to load
        device: Optional device to load the model on ('cuda' or 'cpu'). If None, auto-detects.
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    global _model, _processor, _device
    
    if not _HAS_CLIP:
        return False, "CLIP dependencies not available"
        
    if _model is not None and _processor is not None:
        return True, "Models already loaded"
    
    try:
        import torch
        
        # Update device if specified
        if device is not None:
            if device not in ['cuda', 'cpu']:
                logger.warning(f"Invalid device '{device}', defaulting to auto-detect")
                device = None
            else:
                _device = device
        
        # Auto-detect device if not specified
        if device is None:
            _device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        logger.info(f"Loading CLIP model '{model_name}' on {_device}...")
        
        # Import here to ensure proper initialization
        from transformers import CLIPModel, CLIPProcessor
        
        # Load model and processor
        _model = CLIPModel.from_pretrained(
            model_name,
            cache_dir=CACHE_DIR
        ).to(_device)
        
        _processor = CLIPProcessor.from_pretrained(
            model_name,
            cache_dir=CACHE_DIR
        )
        
        logger.info(f"Successfully loaded CLIP model on {_device}")
        return True, f"Models loaded on {_device}"
        
    except ImportError as e:
        error_msg = f"Failed to import required modules: {e}"
        logger.error(error_msg, exc_info=True)
        return False, error_msg
    except Exception as e:
        error_msg = f"Failed to load CLIP model: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _model, _processor = None, None
        return False, error_msg


def _b64_to_image(b64: str) -> Optional['PILImage.Image']:
    """
    Convert base64 encoded image to PIL Image with validation.
    
    Args:
        b64: Base64 encoded image string, optionally with data URI prefix
        
    Returns:
        PIL Image object or None if conversion fails
    """
    if not _HAS_CLIP or not hasattr(PILImage, 'Image') or not hasattr(PILImage, 'Resampling'):
        logger.warning("Pillow (PIL) is not available or not properly initialized")
        return None
        
    if not b64 or not isinstance(b64, str):
        logger.warning("Invalid base64 input")
        return None
    
    try:
        # Handle data URI if present
        if b64.startswith("data:image"):
            b64 = b64.split(",", 1)[1]
            
        # Decode base64
        data = base64.b64decode(b64)
        
        # Open image with size limit
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        img = Image.open(io.BytesIO(data))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Resize if too large
        if any(dim > max_dim for dim, max_dim in zip(img.size, MAX_IMAGE_SIZE)):
            img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
            
        return img
        
    except Exception as e:
        logger.error(f"Failed to process image: {str(e)}", exc_info=True)
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

    # Initialize models if needed
    if _HAS_CLIP and (_model is None or _processor is None):
        success, msg = _load_clip()
        if not success:
            logger.warning(f"Using fallback mode: {msg}")
            fallback = True

    # Decode and validate images
    valid_images: List['PILImage.Image'] = []
    if images_b64:
        for i, img_b64 in enumerate(images_b64):
            img = _b64_to_image(img_b64)
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
                inputs = _processor(
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
                    matches.append(ImageMatch(index=idx, similarity=sim_float))
                
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
                matches = [ImageMatch(index=i, similarity=0.5) for i in range(len(valid_images))]
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
    
    # Create response without error field if it's None
    response_data = {
        'average_similarity': float(average_similarity),
        'matches': matches,
        'deepfake_flag': deepfake_flag,
        'fallback': fallback,
        'latency_ms': latency_ms
    }
    if error is not None:
        response_data['error'] = error
    
    return VisualResponse(**response_data)
