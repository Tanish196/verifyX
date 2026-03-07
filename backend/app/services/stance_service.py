import logging
from functools import lru_cache
from typing import Dict

from transformers import pipeline

logger = logging.getLogger(__name__)

MODEL_NAME = "facebook/bart-large-mnli"

# Hypothesis template for NLI-based zero-shot classification.
# BART-MNLI interprets: premise=evidence, hypothesis=template.format(label)
_HYPOTHESIS_TEMPLATE = "This evidence {} the claim."
_CANDIDATE_LABELS = ["supports", "refutes", "neutral"]


@lru_cache(maxsize=1)
def get_stance_model():
    """Load and cache the zero-shot classification pipeline (runs once per process)."""
    logger.info("loading_stance_model", extra={"model": MODEL_NAME})
    classifier = pipeline(
        "zero-shot-classification",
        model=MODEL_NAME,
        device=-1,          # force CPU
        framework="pt",
    )
    logger.info("stance_model_loaded", extra={"model": MODEL_NAME})
    return classifier


def detect_stance(claim: str, evidence: str) -> Dict[str, object]:
    # Classify whether evidence supports, refutes, or is neutral to claim.
    if not claim.strip() or not evidence.strip():
        return {"label": "neutral", "score": 0.0}

    try:
        classifier = get_stance_model()

        # Feed evidence as the NLI premise; the claim is baked into the
        # hypothesis template so the model reasons about claim ↔ evidence.
        combined_premise = f"{evidence} [Claim: {claim[:300]}]"

        result = classifier(
            combined_premise,
            candidate_labels=_CANDIDATE_LABELS,
            hypothesis_template=_HYPOTHESIS_TEMPLATE,
        )

        label: str = result["labels"][0]
        score: float = round(float(result["scores"][0]), 4)

        logger.info(
            "stance_detection_complete",
            extra={"claim": claim[:80], "label": label, "score": score},
        )
        return {"label": label, "score": score}

    except Exception as exc:
        logger.error(
            f"Stance detection failed for claim '{claim[:60]}': {exc}; "
            "defaulting to neutral"
        )
        return {"label": "neutral", "score": 0.0}
