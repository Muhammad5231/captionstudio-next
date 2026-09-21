import re


def normalize_hindi(text: str) -> str:
    """
    Normalizes Devanagari Hindi text.
    - Handles Devanagari danda (।) and double danda (॥) punctuation spacing.
    - Cleans up stray latin periods following devanagari characters.
    - Ensures proper word spacing around Devanagari punctuation.
    """
    if not text:
        return ""

    # Remove space before danda or double danda
    text = re.sub(r"\s+([।॥])", r"\1", text)

    # Ensure space after danda or double danda if followed by devanagari or latin text
    text = re.sub(r"([।॥])([A-Za-z0-9\u0900-\u097F])", r"\1 \2", text)

    # Convert Latin full stop to Danda if it ends a pure Devanagari sentence
    # e.g., "नमस्ते दोस्तों." -> "नमस्ते दोस्तों।"
    text = re.sub(r"([\u0900-\u097F]+)\s*\.", r"\1।", text)

    return text.strip()

