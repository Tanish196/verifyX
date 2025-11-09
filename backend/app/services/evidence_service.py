import time
import random
from typing import List

import os
import json
import http.client
import logging
from urllib.parse import quote_plus

from app.models.evidence import EvidenceResponse, FactItem
from app.config import settings

GOOGLE_FACTCHECK_ENDPOINT = "factchecktools.googleapis.com"

# Configure logger for this module
logger = logging.getLogger(__name__)

# Simple claim splitter for demo
CLAIM_SPLIT_DELIMITERS = [".", "?", "!"]
CLAIM_CONNECTORS = [" and ", " or ", " but ", ", "]


def _split_claims(text: str) -> List[str]:
    """Split text into individual claims for fact-checking."""
    parts = []
    current = []

    # First split by sentence delimiters
    for ch in text:
        current.append(ch)
        if ch in CLAIM_SPLIT_DELIMITERS:
            sentence = "".join(current).strip()
            if len(sentence) > 20:
                parts.append(sentence)
            current = []
    leftover = "".join(current).strip()
    if leftover and len(leftover) > 20:
        parts.append(leftover)

    # Then split compound claims connected by "and", "or", etc.
    final_claims = []
    for claim in parts:
        # Check for connectors and split if found
        split_by_connector = False
        for connector in CLAIM_CONNECTORS:
            if connector in claim.lower():
                subclaims = claim.split(connector)
                for subclaim in subclaims:
                    subclaim = subclaim.strip()
                    if len(subclaim) > 15:  # Minimum length for a valid claim
                        final_claims.append(subclaim)
                split_by_connector = True
                break

        if not split_by_connector:
            final_claims.append(claim)

    return final_claims[:5]  # limit to 5 claims


def _google_fact_check(claim: str):
    api_key = settings.FACT_CHECK_API_KEY
    if not api_key:
        logger.debug("No FACT_CHECK_API_KEY configured; skipping Google Fact Check")
        return None

    try:
        # URL-encode query to avoid malformed paths
        q = quote_plus(claim[:1000])
        path = f"/v1alpha1/claims:search?query={q}&key={api_key}"
        logger.debug(f"FactCheck request path: {path}")

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


def check_evidence(text: str) -> EvidenceResponse:
    """
    Check claims in text against Google Fact Check API or mock RAG.

    Args:
        text: Text containing claims to verify

    Returns:
        EvidenceResponse with fact-checked claims and overall accuracy
    """
    start = time.time()
    claims = _split_claims(text)
    facts: List[FactItem] = []

    for claim in claims:
        api_data = _google_fact_check(claim)
        logger.info(
            f"API data for claim '{claim[:50]}...': {api_data is not None}, has claims: {api_data.get('claims') if api_data else 'N/A'}"
        )

        if api_data and api_data.get("claims"):
            # Extract first claim result
            claim_obj = api_data["claims"][0]
            rating = claim_obj.get("claimReview", [{}])[0].get(
                "textualRating", "Unknown"
            )
            site = (
                claim_obj.get("claimReview", [{}])[0].get("publisher", {}).get("name")
            )
            url = claim_obj.get("claimReview", [{}])[0].get("url")
            facts.append(
                FactItem(
                    claim=claim, verdict=rating, source=site, url=url, confidence=0.75
                )
            )
            logger.info(f"Found fact-check: {rating} from {site}")
        else:
            # Mock RAG fallback when API returns no results
            logger.warning(f"No fact-check results found for claim: {claim[:100]}")
            verdict = random.choice(
                ["Likely True", "Likely False", "Needs Context", "Uncertain"]
            )
            facts.append(
                FactItem(
                    claim=claim,
                    verdict=verdict,
                    source=None,
                    url=None,
                    confidence=random.uniform(0.4, 0.85),
                )
            )

    coverage_ratio = len(facts) / max(1, len(claims))
    overall_accuracy_score = sum(f.confidence for f in facts) / max(1, len(facts))
    latency_ms = int((time.time() - start) * 1000)

    # Determine actual provider based on whether we got real results
    used_api = any(f.source is not None for f in facts)
    provider = "google_fact_check" if used_api else "mock_rag"

    return EvidenceResponse(
        provider=provider,
        facts_checked=facts,
        coverage_ratio=coverage_ratio,
        overall_accuracy_score=overall_accuracy_score,
        latency_ms=latency_ms,
    )
