import re


def clean_whitespace(text: str) -> str:
    """Collapses multiple spaces, tabs, and unneeded blank lines into a clean string."""
    if not text:
        return ""
    # Normalize unicode whitespace
    text = re.sub(r"[\u00A0\u2000-\u200B\u202F\u205F\u3000]", " ", text)
    # Collapse multiple spaces
    text = re.sub(r"[ \t]+", " ", text)
    # Strip leading and trailing whitespace
    return text.strip()


def fix_punctuation_spacing(text: str) -> str:
    """Removes spaces before punctuation marks and ensures proper space following them."""
    if not text:
        return ""
    # Remove whitespace before standard punctuation marks: , . ? ! : ;
    text = re.sub(r"\s+([,.:;?!])", r"\1", text)
    # Ensure space after punctuation if followed immediately by an alphanumeric character
    text = re.sub(r"([,.:;?!])([A-Za-z0-9\u0900-\u097F])", r"\1 \2", text)
    return text.strip()


def remove_repeated_words(text: str) -> str:
    """Removes accidental consecutive duplicate words (stutters) e.g., 'the the' -> 'the'."""
    if not text:
        return ""
    # Match consecutive duplicate words case-insensitively
    pattern = re.compile(r"\b(\w+)\s+\1\b", flags=re.IGNORECASE)
    # Apply iteratively in case of triple repeats ('the the the')
    prev = None
    curr = text
    while prev != curr:
        prev = curr
        curr = pattern.sub(r"\1", curr)
    return curr

