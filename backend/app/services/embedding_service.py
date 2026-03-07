import logging
from functools import lru_cache
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load and cache the SentenceTransformer model (runs once per process)."""
    logger.info("loading_embedding_model", extra={"model": MODEL_NAME})
    model = SentenceTransformer(MODEL_NAME)
    logger.info("embedding_model_loaded", extra={"model": MODEL_NAME})
    return model


def embed_texts(texts: List[str]) -> np.ndarray:
    # Encode a list of strings into L2-normalised float32 embeddings.
    model = get_embedding_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
        batch_size=32,
    )
    return embeddings.astype("float32")
