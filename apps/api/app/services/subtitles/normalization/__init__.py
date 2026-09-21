import re
from apps.api.app.services.subtitles.normalization.common import (
    clean_whitespace,
    fix_punctuation_spacing,
    remove_repeated_words,
)
from apps.api.app.services.subtitles.normalization.hinglish import normalize_hinglish
from apps.api.app.services.subtitles.normalization.hindi import normalize_hindi
from apps.api.app.services.subtitles.normalization.english import normalize_english

DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]")


def normalize_caption_text(text: str, language: str = "auto") -> str:
    """
    Unified entry point for caption text normalization.
    Cleans punctuation, whitespace, stutters, and applies script/language specific rules.
    Preserves mixed-language Hinglish without forced translation or corrupted casing.
    """
    if not text:
        return ""

    # Phase 1: Common whitespace and repetition normalization
    normalized = clean_whitespace(text)
    normalized = remove_repeated_words(normalized)
    normalized = fix_punctuation_spacing(normalized)

    # Phase 2: Script and language detection
    has_devanagari = bool(DEVANAGARI_REGEX.search(normalized))
    lang_lower = (language or "auto").lower().strip()

    if has_devanagari:
        normalized = normalize_hindi(normalized)
    elif lang_lower in ("hinglish", "hi-latn", "en-in", "hi"):
        normalized = normalize_hinglish(normalized)
    elif lang_lower in ("en", "auto"):
        # If Latin script, apply English and Hinglish-safe rules
        normalized = normalize_english(normalized)
        normalized = normalize_hinglish(normalized)
    else:
        # Fallback: ensure sentence capitalization
        if len(normalized) > 0 and normalized[0].islower():
            normalized = normalized[0].upper() + normalized[1:]

    return clean_whitespace(normalized)

