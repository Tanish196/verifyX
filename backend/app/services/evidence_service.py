import time
from typing import List

import json
import http.client
import logging
import re
from urllib.parse import quote_plus, urlparse

import httpx

from app.models.evidence import EvidenceResponse, FactItem
from app.config import settings

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
    Retrieve web evidence for a claim using the Serper.dev Google Search API.

    Args:
        claim: The claim text to search for.

    Returns:
        A list of evidence dicts, each with keys: source, title, snippet, url.
        Returns an empty list on any failure.
    """
    api_key = settings.SERPER_API_KEY
    if not api_key:
        logger.warning("SERPER_API_KEY not configured; skipping Serper web evidence retrieval")
        return []

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

    results = []
    for item in data.get("organic", [])[:5]:
        link = item.get("link", "")
        try:
            domain = urlparse(link).netloc.lstrip("www.")
        except Exception:
            domain = link

        results.append({
            "source": domain,
            "title": item.get("title", ""),
            "snippet": item.get("snippet", ""),
            "url": link,
        })

    logger.info("serper_results", extra={"claim": claim[:80], "results": len(results)})
    return results


async def check_evidence(text: str) -> EvidenceResponse:
    """
    Check claims in text against Google Fact Check API, falling back to
    Serper.dev web evidence retrieval when no fact-check results are found.

    Args:
        text: Text containing claims to verify.

    Returns:
        EvidenceResponse with fact-checked claims and overall accuracy score.
    """
    start = time.time()
    claims = _split_claims(text)
    facts: List[FactItem] = []

    for claim in claims:
        api_data = _google_fact_check(claim)
        logger.info(
            f"FactCheck data for claim '{claim[:50]}': present={api_data is not None}, "
            f"has_claims={bool(api_data.get('claims') if api_data else False)}"
        )

        if api_data and api_data.get("claims"):
            # Google Fact Check returned results — use them.
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
            # No fact-check results — fall back to Serper web evidence retrieval.
            logger.warning(f"No fact-check results for claim: {claim[:100]}")
            web_results = await retrieve_web_evidence(claim)

            if web_results:
                for result in web_results:
                    facts.append(
                        FactItem(
                            claim=claim,
                            verdict="Web Source",
                            source=result["source"],
                            url=result["url"],
                            confidence=0.5,
                        )
                    )
                logger.info(f"Serper returned {len(web_results)} result(s) for claim: {claim[:60]}")
            else:
                # No evidence found from either source.
                logger.warning(f"No evidence found (Fact Check + Serper) for claim: {claim[:100]}")
                facts.append(
                    FactItem(
                        claim=claim,
                        verdict="No Evidence Found",
                        source=None,
                        url=None,
                        confidence=0.1,
                    )
                )

    # coverage_ratio: fraction of claims that have at least one real source
    claims_with_source = len(set(f.claim for f in facts if f.source is not None))
    coverage_ratio = claims_with_source / max(1, len(claims))

    # overall_accuracy_score: min(1.0, total_sources / 5) per task specification
    total_sources = len([f for f in facts if f.source is not None])
    overall_accuracy_score = min(1.0, total_sources / 5)

    latency_ms = int((time.time() - start) * 1000)

    serper_used = any(f.verdict == "Web Source" for f in facts)
    factcheck_used = any(f.verdict not in ("Web Source", "No Evidence Found") for f in facts)

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
        overall_accuracy_score=overall_accuracy_score,
        latency_ms=latency_ms,
    )
