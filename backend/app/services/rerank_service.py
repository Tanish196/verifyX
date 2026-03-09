import logging
from functools import lru_cache
from typing import List

from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@lru_cache(maxsize=1)
def get_rerank_model() -> CrossEncoder:
    """Load and cache the cross-encoder model (runs once per process)."""
    logger.info("loading_rerank_model", extra={"model": MODEL_NAME})
    model = CrossEncoder(MODEL_NAME, device="cpu")
    logger.info("rerank_model_loaded", extra={"model": MODEL_NAME})
    return model


def rerank_documents(query: str, docs: List[dict], top_k: int = 3) -> List[dict]:
    # Re-rank *docs* against *query* using the cross-encoder.
    if not docs:
        return []

    model = get_rerank_model()

    # Build (query, document) pairs for batch prediction.
    pairs = [[query, doc.get("text", "")] for doc in docs]

    scores = model.predict(pairs)

    # Annotate each doc with its cross-encoder score.
    annotated = []
    for doc, score in zip(docs, scores):
        entry = dict(doc)          # shallow copy so we don't mutate callers' data
        entry["rerank_score"] = round(float(score), 6)
        annotated.append(entry)

    # Sort descending by score and return top-k.
    ranked = sorted(annotated, key=lambda d: d["rerank_score"], reverse=True)

    logger.info(
        "rerank_complete",
        extra={"query": query[:80], "input_docs": len(docs), "top_k": top_k},
    )

    return ranked[:top_k]
