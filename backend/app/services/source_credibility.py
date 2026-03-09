from urllib.parse import urlparse

# Known-source credibility weights.  Scores are on a 0.0–1.0 scale.
SOURCE_WEIGHTS: dict[str, float] = {
    "who.int": 0.95,
    "reuters.com": 0.9,
    "bbc.com": 0.9,
    "nytimes.com": 0.9,
    "nature.com": 0.95,
    "wikipedia.org": 0.8,
    "medium.com": 0.6,
}

# Weight applied when no known mapping exists for a domain.
DEFAULT_WEIGHT: float = 0.5


def get_source_weight(url: str) -> float:
    # Return the credibility weight for *url*'s domain.
    if not url:
        return DEFAULT_WEIGHT

    try:
        parsed = urlparse(url)
        # netloc may be empty for relative or malformed URLs.
        netloc = parsed.netloc or parsed.path
        domain = netloc.lstrip("www.").split(":")[0].lower()  # strip port too

        # Exact match first.
        if domain in SOURCE_WEIGHTS:
            return SOURCE_WEIGHTS[domain]

        # Suffix match: allows sub-domains (e.g. en.wikipedia.org → wikipedia.org).
        for known_domain, weight in SOURCE_WEIGHTS.items():
            if domain == known_domain or domain.endswith("." + known_domain):
                return weight
    except Exception:
        pass

    return DEFAULT_WEIGHT
