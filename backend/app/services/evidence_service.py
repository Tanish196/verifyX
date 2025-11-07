import time
import random
from typing import List

from ..models.evidence import EvidenceResponse, FactItem
from ..config import settings
import os
import json
import http.client

GOOGLE_FACTCHECK_ENDPOINT = "factchecktools.googleapis.com"

# Simple claim splitter for demo
CLAIM_SPLIT_DELIMITERS = [".", "?", "!"]


def _split_claims(text: str) -> List[str]:
    parts = []
    current = []
    for ch in text:
        current.append(ch)
        if ch in CLAIM_SPLIT_DELIMITERS:
            sentence = "".join(current).strip()
            if len(sentence) > 20:
                parts.append(sentence)
            current = []
    leftover = "".join(current).strip()
    if leftover:
        parts.append(leftover)
    return parts[:5]  # limit


def _google_fact_check(claim: str):
    api_key = settings.FACT_CHECK_API_KEY
    if not api_key:
        return None
    try:
        conn = http.client.HTTPSConnection(GOOGLE_FACTCHECK_ENDPOINT, timeout=5)
        path = f"/v1alpha1/claims:search?query={claim[:200]}&key={api_key}"  # naive escaping
        conn.request("GET", path)
        resp = conn.getresponse()
        if resp.status != 200:
            return None
        data = json.loads(resp.read().decode())
        return data
    except Exception:
        return None


def check_evidence(text: str) -> EvidenceResponse:
    start = time.time()
    claims = _split_claims(text)
    facts: List[FactItem] = []

    for claim in claims:
        api_data = _google_fact_check(claim)
        if api_data and api_data.get("claims"):
            # Extract first claim result
            claim_obj = api_data["claims"][0]
            rating = claim_obj.get("claimReview", [{}])[0].get("textualRating", "Unknown")
            site = claim_obj.get("claimReview", [{}])[0].get("publisher", {}).get("name")
            url = claim_obj.get("claimReview", [{}])[0].get("url")
            facts.append(FactItem(
                claim=claim,
                verdict=rating,
                source=site,
                url=url,
                confidence=0.75
            ))
        else:
            # Mock RAG fallback
            verdict = random.choice(["Likely True", "Likely False", "Needs Context", "Uncertain"])
            facts.append(FactItem(
                claim=claim,
                verdict=verdict,
                source=None,
                url=None,
                confidence=random.uniform(0.4, 0.85)
            ))

    coverage_ratio = len(facts) / max(1, len(claims))
    overall_accuracy_score = sum(f.confidence for f in facts) / max(1, len(facts))
    latency_ms = int((time.time() - start) * 1000)

    return EvidenceResponse(
        provider="google_fact_check" if settings.FACT_CHECK_API_KEY else "mock_rag",
        facts_checked=facts,
        coverage_ratio=coverage_ratio,
        overall_accuracy_score=overall_accuracy_score,
        latency_ms=latency_ms,
    )
