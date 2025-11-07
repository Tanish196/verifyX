import base64
import io
import time
from typing import List

from ..models.visual import VisualResponse, ImageMatch

try:
    import torch  # type: ignore
    from PIL import Image  # type: ignore
    from transformers import CLIPProcessor, CLIPModel  # type: ignore
    _HAS_CLIP = True
except Exception:
    Image = None
    CLIPProcessor = None
    CLIPModel = None
    _HAS_CLIP = False

_model = None
_processor = None


def _load_clip():
    global _model, _processor
    if _HAS_CLIP and (_model is None or _processor is None):
        try:
            _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        except Exception:
            _model, _processor = None, None


def _b64_to_image(b64: str):
    if not Image:
        return None
    try:
        if b64.startswith("data:image"):
            b64 = b64.split(",", 1)[1]
        data = base64.b64decode(b64)
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        return None


def analyze_images(text: str, images_b64: List[str]) -> VisualResponse:
    start = time.time()
    matches: List[ImageMatch] = []
    average_similarity = 0.0
    deepfake_flag = False
    fallback = False

    if _HAS_CLIP and (_model is None or _processor is None):
        _load_clip()

    valid_images = [img for img in ([_b64_to_image(b) for b in images_b64] if images_b64 else []) if img is not None]

    if _model is not None and _processor is not None and valid_images:
        try:
            inputs = _processor(text=[text]*len(valid_images), images=valid_images, return_tensors="pt", padding=True)
            with torch.no_grad():
                outputs = _model(**inputs)
                logits_per_image = outputs.logits_per_image  # [N]
                sims = logits_per_image.softmax(dim=0).squeeze().tolist()
                if isinstance(sims, float):
                    sims = [sims]
            for idx, sim in enumerate(sims):
                matches.append(ImageMatch(index=idx, similarity=float(sim)))
            average_similarity = float(sum(s for s in sims) / max(1, len(sims)))
            deepfake_flag = average_similarity < 0.25
        except Exception:
            fallback = True
    else:
        fallback = True

    if fallback:
        # Heuristic fallback: no images or no CLIP; assume unknown
        matches = [ImageMatch(index=i, similarity=0.5, notes="fallback") for i, _ in enumerate(images_b64 or [])]
        average_similarity = 0.5 if images_b64 else 0.0
        deepfake_flag = False

    latency_ms = int((time.time() - start) * 1000)
    return VisualResponse(
        average_similarity=average_similarity,
        matches=matches,
        deepfake_flag=deepfake_flag,
        fallback=fallback,
        latency_ms=latency_ms,
    )
