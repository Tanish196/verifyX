import time
from typing import List

import json
import http.client
import logging
import re
from urllib.parse import quote_plus, urlparse

import httpx

from app.models.evidence import EvidenceResponse, EvidenceItem, FactItem, StanceSummary
from app.config import settings
from app.services.vector_retriever import build_index, search_index
from app.services.stance_service import detect_stance
from app.services.rerank_service import rerank_documents
from app.services.source_credibility import get_source_weight

GOOGLE_FACTCHECK_ENDPOINT = "factchecktools.googleapis.com"
SERPER_ENDPOINT = "https://google.serper.dev/search"
logger = logging.getLogger(__name__)


def _is_likely_ui_text(claim: str) -> bool:
    """Heuristic to detect UI/navigation strings to avoid false claims."""
    claim_lower = claim.lower()
    # Use word-boundary patterns to avoid false positives on substrings
    ui_word_patterns = [
        r'\bsign in\b', r'\bsubscribe\b', r'\blogin\b', r'\blogout\b',
        r'\bregister\b', r'\bclick here\b', r'\bread more\b',
        r'\bmore stories\b', r'\bprivacy policy\b', r'\badvertisement\b',
        r'\bcookie policy\b',
    ]
    if any(re.search(p, claim_lower) for p in ui_word_patterns):
        return True

    # Very high ALL-CAPS ratio
    capitals = sum(1 for c in claim if c.isupper())
    if len(claim) > 10 and capitals / len(claim) > 0.5:
        return True

    # Timestamp-style strings
    if re.search(r'\d{4}[,\s]+\d{1,2}:\d{2}', claim):
        return True

    return False


def _split_claims(text: str) -> List[str]:
    """Split text into individual claims for fact-checking."""
    # Use regex to split on sentence-ending punctuation followed by whitespace or end-of-string.
    # This is more robust than a character-by-character loop.
    raw_sentences = re.split(r'(?<=[.!?])\s+', text.strip())

    final_claims = []
    for sentence in raw_sentences:
        sentence = sentence.strip()
        if len(sentence) <= 20:
            continue
        if _is_likely_ui_text(sentence):
            logger.debug(f"Filtering likely UI text: {sentence[:80]}")
            continue
        final_claims.append(sentence)
        if len(final_claims) == 5:
            break

    return final_claims


def _google_fact_check(claim: str):
    api_key = settings.FACT_CHECK_API_KEY
    if not api_key:
        logger.debug("No FACT_CHECK_API_KEY configured; skipping Google Fact Check")
        return None

    try:
        # URL-encode query to avoid malformed paths
        q = quote_plus(claim[:1000])
        path = f"/v1alpha1/claims:search?query={q}&key={api_key}"
        # Sanitize path for logging so API key is never written to logs
        try:
            sanitized = re.sub(r'([?&]key=)[^&]+', r"\1<REDACTED>", path)
        except Exception:
            sanitized = "(sanitization_failed)"
        logger.debug(f"FactCheck request path: {sanitized}")

        conn = http.client.HTTPSConnection(GOOGLE_FACTCHECK_ENDPOINT, timeout=10)
        conn.request("GET", path)
        resp = conn.getresponse()
        body = resp.read().decode()

        # Log status/body for debugging when things go wrong (limit size)
        logger.debug(f"FactCheck response status={resp.status}")
        if resp.status != 200:
            logger.warning(f"FactCheck non-200 response: {resp.status} - {body[:1000]}")
            return None

        try:
            data = json.loads(body)
            logger.info(f"FactCheck API returned: {json.dumps(data, indent=2)[:500]}")
            return data
        except Exception as e:
            logger.exception("Failed to parse FactCheck JSON response")
            return None

    except Exception as e:
        logger.exception("Error while contacting Google Fact Check API")
        return None


async def retrieve_web_evidence(claim: str) -> List[dict]:
    """
    Retrieve and re-rank web evidence for a claim.

    Pipeline
    1. Serper.dev Google Search → up to 10 organic results.
    2. Embedding + FAISS retrieval → top 10 semantically closest snippets.
    3. Cross-encoder re-ranking → top 3 most relevant documents.
    """
    api_key = settings.SERPER_API_KEY
    if not api_key:
        logger.warning("SERPER_API_KEY not configured; skipping Serper web evidence retrieval")
        return []

    # Step 1 – Serper search
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                SERPER_ENDPOINT,
                headers={
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json",
                },
                json={"q": claim[:1000], "num": 5},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Serper API HTTP error for claim '{claim[:60]}': {e.response.status_code}")
        return []
    except Exception as e:
        logger.error(f"Serper API error for claim '{claim[:60]}': {e}")
        return []

    raw_results: List[dict] = []
    for item in data.get("organic", [])[:10]:
        link = item.get("link", "")
        try:
            domain = urlparse(link).netloc.lstrip("www.")
        except Exception:
            domain = link

        snippet = item.get("snippet", "")
        if not snippet:
            continue  # skip results without searchable text

        raw_results.append({
            "text": snippet,
            "url": link,
            "source": domain,
            "title": item.get("title", ""),
        })

    if not raw_results:
        logger.warning(f"Serper returned no usable snippets for claim: {claim[:80]}")
        return []

    logger.info(
        "serper_results",
        extra={"claim": claim[:80], "results": len(raw_results)},
    )

    # Step 2 – Embedding + FAISS retrieval (top 10)
    faiss_ranked: List[dict] = raw_results  # default fallback
    snippets = [r["text"] for r in raw_results]
    try:
        index, _ = build_index(snippets)
        top_snippets = search_index(
            index=index,
            query=claim,
            docs=snippets,
            k=min(10, len(snippets)),
        )
        # Map snippet text → original result dict (first-occurrence wins).
        snippet_map: dict = {}
        for r in raw_results:
            s = r["text"]
            if s not in snippet_map:
                snippet_map[s] = r

        ordered = [snippet_map[s] for s in top_snippets if s in snippet_map]
        if ordered:
            faiss_ranked = ordered
            logger.info(
                "faiss_retrieval_complete",
                extra={"claim": claim[:60], "returned": len(faiss_ranked)},
            )
    except Exception as e:
        logger.error(
            f"FAISS retrieval failed for claim '{claim[:60]}'; "
            f"proceeding with original Serper order. Error: {e}"
        )

    # Step 3 – Cross-encoder re-ranking → top 3
    try:
        reranked = rerank_documents(claim, faiss_ranked, top_k=3)
        logger.info(
            "rerank_complete",
            extra={"claim": claim[:60], "top_k": len(reranked)},
        )
        return reranked
    except Exception as e:
        logger.error(
            f"Cross-encoder re-ranking failed for claim '{claim[:60]}'; "
            f"returning top-3 FAISS results. Error: {e}"
        )
        # Graceful fallback: return first 3 FAISS results without rerank_score.
        fallback = []
        for doc in faiss_ranked[:3]:
            entry = dict(doc)
            entry.setdefault("rerank_score", 0.0)
            fallback.append(entry)
        return fallback


async def check_evidence(text: str) -> EvidenceResponse:
    """
    Check claims in *text* against Google Fact Check API, falling back to the
    upgraded Serper + FAISS + cross-encoder + stance + credibility pipeline.

    The returned ``overall_accuracy_score`` (and ``score``) is always
    deterministic — no random verdicts are ever produced.
    """
    start = time.time()
    claims = _split_claims(text)
    facts: List[FactItem] = []
    all_evidence_items: List[EvidenceItem] = []

    agg_support = 0
    agg_refute = 0
    agg_neutral = 0

    serper_used = False
    factcheck_used = False

    for claim in claims:
        api_data = _google_fact_check(claim)
        logger.info(
            f"FactCheck data for claim '{claim[:50]}': present={api_data is not None}, "
            f"has_claims={bool(api_data.get('claims') if api_data else False)}"
        )

        if api_data and api_data.get("claims"):
            # Google Fact Check returned results — use them directly.
            factcheck_used = True
            claim_obj = api_data["claims"][0]
            rating = claim_obj.get("claimReview", [{}])[0].get("textualRating", "Unknown")
            site = (
                claim_obj.get("claimReview", [{}])[0].get("publisher", {}).get("name")
            )
            url = claim_obj.get("claimReview", [{}])[0].get("url")
            facts.append(
                FactItem(claim=claim, verdict=rating, source=site, url=url, confidence=0.75)
            )
            logger.info(f"FactCheck result: '{rating}' from {site}")

        else:
            # No fact-check results — run the upgraded evidence pipeline:
            # Serper → FAISS (top 10) → Cross-encoder (top 3) →
            # Stance detection → Source credibility → Weighted score
            logger.warning(f"No fact-check results for claim: {claim[:100]}")

            web_results = await retrieve_web_evidence(claim)

            if web_results:
                serper_used = True
                logger.info(
                    "stance_detection",
                    extra={"claim": claim[:80], "evidence": len(web_results)},
                )

                for doc in web_results:
                    snippet = doc.get("text", "")
                    url = doc.get("url", "")
                    source = doc.get("source", "")
                    rerank_score = doc.get("rerank_score", 0.0)

                    # Source credibility weight for this document.
                    credibility = get_source_weight(url)

                    # Deterministic stance detection via NLI.
                    stance_result = detect_stance(claim, snippet)
                    stance = stance_result["stance"]
                    confidence = stance_result["confidence"]

                    # Accumulate stance counters.
                    if stance == "supports claim":
                        agg_support += 1
                    elif stance == "refutes claim":
                        agg_refute += 1
                    else:
                        agg_neutral += 1

                    # Backward-compat FactItem (verdict = stance label).
                    facts.append(
                        FactItem(
                            claim=claim,
                            verdict=stance,
                            source=source or None,
                            url=url or None,
                            confidence=confidence,
                        )
                    )

                    # Rich EvidenceItem for the new response fields.
                    all_evidence_items.append(
                        EvidenceItem(
                            text=snippet,
                            url=url or None,
                            stance=stance,
                            credibility=credibility,
                            rerank_score=rerank_score,
                        )
                    )

                logger.info(
                    f"Evidence pipeline complete: {len(web_results)} doc(s) "
                    f"for claim '{claim[:60]}'"
                )

            else:
                # No evidence at all — record a deterministic "no evidence" result.
                logger.warning(
                    f"No evidence found (Fact Check + Serper) for claim: {claim[:100]}"
                )
                facts.append(
                    FactItem(
                        claim=claim,
                        verdict="No Evidence Found",
                        source=None,
                        url=None,
                        confidence=0.1,
                    )
                )

    # Weighted evidence score
    # For each evidence item: weighted_total += credibility
    # If stance == "supports claim": weighted_support += credibility
    # score = weighted_support / weighted_total  (fallback 0.5 if no evidence)
    if all_evidence_items:
        weighted_support = 0.0
        weighted_total = 0.0
        for item in all_evidence_items:
            weighted_total += item.credibility
            if item.stance == "supports claim":
                weighted_support += item.credibility
        score = weighted_support / weighted_total if weighted_total > 0.0 else 0.5
    else:
        score = 0.5

    # coverage_ratio: fraction of claims with at least one real source
    claims_with_source = len(set(f.claim for f in facts if f.source is not None))
    coverage_ratio = claims_with_source / max(1, len(claims))

    # Build summary objects
    stance_summary = StanceSummary(
        support=agg_support,
        refute=agg_refute,
        neutral=agg_neutral,
    )

    latency_ms = int((time.time() - start) * 1000)

    if factcheck_used and serper_used:
        provider = "google_fact_check+serper_web"
    elif factcheck_used:
        provider = "google_fact_check"
    elif serper_used:
        provider = "serper_web"
    else:
        provider = "none"

    return EvidenceResponse(
        provider=provider,
        facts_checked=facts,
        coverage_ratio=coverage_ratio,
        overall_accuracy_score=score,   # kept for synth_service compatibility
        latency_ms=latency_ms,
        score=score,
        stance_summary=stance_summary,
        evidence=all_evidence_items if all_evidence_items else None,
    )
