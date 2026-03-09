import logging
from functools import lru_cache
from typing import Dict

from transformers import pipeline

logger = logging.getLogger(__name__)

MODEL_NAME = "facebook/bart-large-mnli"

# Candidate labels for NLI-based zero-shot classification.
# These are used directly so the model can classify the stance of evidence
# relative to a claim without a custom hypothesis template.
_CANDIDATE_LABELS = ["supports claim", "refutes claim", "neutral"]

# NLI hypothesis template interpreted by BART-MNLI as:
# premise = evidence text + claim context
# hypothesis = "This evidence {label}."
_HYPOTHESIS_TEMPLATE = "This evidence {}."


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


def detect_stance(claim: str, evidence_text: str) -> Dict[str, object]:
    # Classify whether evidence_text supports, refutes, or is neutral to claim.
    if not claim.strip() or not evidence_text.strip():
        return {"stance": "neutral", "confidence": 0.0}

    try:
        classifier = get_stance_model()

        # Feed evidence as the NLI premise; the claim is appended so the
        # model reasons about the claim evidence relationship.
        combined_premise = f"{evidence_text} [Claim: {claim[:300]}]"

        result = classifier(
            combined_premise,
            candidate_labels=_CANDIDATE_LABELS,
            hypothesis_template=_HYPOTHESIS_TEMPLATE,
        )

        stance: str = result["labels"][0]
        confidence: float = round(float(result["scores"][0]), 4)

        logger.info(
            "stance_detection_complete",
            extra={"claim": claim[:80], "stance": stance, "confidence": confidence},
        )
        return {"stance": stance, "confidence": confidence}

    except Exception as exc:
        logger.error(
            f"Stance detection failed for claim '{claim[:60]}': {exc}; "
            "defaulting to neutral"
        )
        return {"stance": "neutral", "confidence": 0.0}
