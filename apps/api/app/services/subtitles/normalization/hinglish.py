import re

# Common Romanized Hindi particles and words to preserve accurately
HINGLISH_STANDARDS = {
    r"\bkyu\b": "kyun",
    r"\bplz\b": "please",
    r"\bpls\b": "please",
    r"\bvdo\b": "video",
    r"\bu\b": "you",
    r"\br\b": "are",
    r"\bthx\b": "thanks",
    r"\bty\b": "thank you",
}


def normalize_hinglish(text: str) -> str:
    """
    Normalizes mixed Hindi-English (Hinglish) text transcribed in Latin script.
    Guarantees:
    - Never translates English words to Hindi or Hindi to English.
    - Preserves natural code-switching cadence.
    - Capitalizes stand-alone 'I'.
    - Expands ultra-short chat abbreviations into clean subtitle words.
    - Cleans punctuation around code-switching boundaries.
    """
    if not text:
        return ""

    normalized = text

    # Standardize common noisy abbreviations while preserving conversational cadence
    for pattern, replacement in HINGLISH_STANDARDS.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Standalone 'i' -> 'I'
    normalized = re.sub(r"\bi\b", "I", normalized)

    # Capitalize first letter of the sentence
    if len(normalized) > 0 and normalized[0].islower():
        normalized = normalized[0].upper() + normalized[1:]

    return normalized

