import time
from typing import List

from ..models.linguistic import LinguisticResponse, ManipulationSignal

# Optional heavy libs
try:
    from transformers import pipeline  # type: ignore
    _TRANSFORMERS = True
except Exception:
    pipeline = None
    _TRANSFORMERS = False

LABELS = [
    "manipulative",
    "sensational",
    "neutral",
    "informational",
]

SENTIMENT_LABELS = ["negative", "neutral", "positive"]

_zero_shot = None
_sentiment = None


def _load_models():
    global _zero_shot, _sentiment
    if _TRANSFORMERS and _zero_shot is None:
        try:
            _zero_shot = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        except Exception:
            _zero_shot = None
    if _TRANSFORMERS and _sentiment is None:
        try:
            _sentiment = pipeline("sentiment-analysis")
        except Exception:
            _sentiment = None


def analyze_text(text: str) -> LinguisticResponse:
    start = time.time()

    signals: List[ManipulationSignal] = []
    raw_probs = {}

    dominant_tone = "neutral"
    manipulation_score = 0.3
    sentiment = "neutral"

    if _zero_shot is None and _TRANSFORMERS:
        _load_models()

    if _zero_shot is not None:
        try:
            result = _zero_shot(text, LABELS)
            labels = result["labels"]
            scores = result["scores"]
            raw_probs = {l: float(s) for l, s in zip(labels, scores)}
            dominant_tone = labels[0]
            # Define manipulation score as sum of manipulative + sensational probs
            manipulation_score = float(raw_probs.get("manipulative", 0) + raw_probs.get("sensational", 0))
        except Exception:
            pass
    else:
        # Heuristic fallback
        lower = text.lower()
        keywords = ["hoax", "fake", "conspiracy", "secret", "you won't believe", "shocking", "exposed"]
        hits = sum(1 for k in keywords if k in lower)
        manipulation_score = min(1.0, 0.2 + 0.15 * hits)
        dominant_tone = "manipulative" if hits >= 2 else "neutral"
        raw_probs = {"manipulative": manipulation_score, "neutral": 1 - manipulation_score}

    if _sentiment is not None:
        try:
            s = _sentiment(text)[0]
            sentiment = s["label"].lower()
        except Exception:
            pass

    # Build signals list
    for label, prob in raw_probs.items():
        signals.append(ManipulationSignal(label=label, confidence=float(prob)))

    latency_ms = int((time.time() - start) * 1000)
    return LinguisticResponse(
        dominant_tone=dominant_tone,
        sentiment=sentiment,
        manipulation_score=float(manipulation_score),
        signals=signals,
        raw_probs=raw_probs,
        latency_ms=latency_ms,
    )
