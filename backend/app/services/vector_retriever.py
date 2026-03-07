import logging
from typing import List, Tuple

import faiss
import numpy as np

from app.services.embedding_service import embed_texts

logger = logging.getLogger(__name__)


def build_index(snippets: List[str]) -> Tuple[faiss.Index, np.ndarray]:
    # Embed snippets and insert them into a new FAISS IndexFlatL2.
    if not snippets:
        raise ValueError("build_index received an empty snippet list")

    embeddings: np.ndarray = embed_texts(snippets)
    dim: int = embeddings.shape[1]

    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    logger.info("vector_index_built", extra={"snippets": len(snippets)})
    return index, embeddings


def search_index(
    index: faiss.Index,
    query: str,
    docs: List[str],
    k: int = 3,
) -> List[str]:
    # Return the top-k docs most semantically similar to query.
    if not docs or k <= 0:
        return []

    k = min(k, len(docs))

    query_embedding: np.ndarray = embed_texts([query])  # shape (1, dim)
    _, indices = index.search(query_embedding, k)

    results = [docs[i] for i in indices[0] if 0 <= i < len(docs)]
    logger.info("vector_retrieval", extra={"query": query[:80], "results": len(results)})
    return results
