import re

COMMON_CONTRACTIONS = {
    r"\bi\b": "I",
    r"\bim\b": "I'm",
    r"\bive\b": "I've",
    r"\bid\b": "I'd",
    r"\bill\b": "I'll",
    r"\bdont\b": "don't",
    r"\bcant\b": "can't",
    r"\bwont\b": "won't",
    r"\bdidnt\b": "didn't",
    r"\bisnt\b": "isn't",
    r"\barent\b": "aren't",
    r"\bwasnt\b": "wasn't",
    r"\bwerent\b": "weren't",
    r"\bhavent\b": "haven't",
    r"\bhasnt\b": "hasn't",
    r"\bhadnt\b": "hadn't",
    r"\bcouldnt\b": "couldn't",
    r"\bwouldnt\b": "wouldn't",
    r"\bshouldnt\b": "shouldn't",
}


def normalize_english(text: str) -> str:
    """
    Normalizes English subtitle text.
    - Restores missing contraction apostrophes.
    - Capitalizes stand-alone 'I'.
    - Capitalizes the start of sentences.
    """
    if not text:
        return ""

    normalized = text

    # Apply contractions
    for pattern, replacement in COMMON_CONTRACTIONS.items():
        normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Capitalize after terminal punctuation (. ? !)
    def cap_match(match):
        punct = match.group(1)
        space = match.group(2)
        char = match.group(3)
        return f"{punct}{space}{char.upper()}"

    normalized = re.sub(r"([.?!])(\s+)([a-z])", cap_match, normalized)

    # Capitalize first character
    if len(normalized) > 0 and normalized[0].islower():
        normalized = normalized[0].upper() + normalized[1:]

    return normalized

