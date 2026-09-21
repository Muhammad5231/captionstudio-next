import pytest
from apps.api.app.services.subtitles.normalization import normalize_caption_text
from apps.api.app.services.subtitles.normalization.common import (
    clean_whitespace,
    fix_punctuation_spacing,
    remove_repeated_words,
)
from apps.api.app.services.subtitles.normalization.hinglish import normalize_hinglish
from apps.api.app.services.subtitles.normalization.hindi import normalize_hindi
from apps.api.app.services.subtitles.normalization.english import normalize_english
from apps.api.app.services.captions.grouping_service import CaptionGroupingService, GroupingOptions
from apps.api.app.services.transcription.base import TimedWord


def test_common_whitespace_and_punctuation():
    text = "   Hello   world  !   How are   you ?   "
    cleaned = clean_whitespace(text)
    assert cleaned == "Hello world ! How are you ?"

    fixed = fix_punctuation_spacing(cleaned)
    assert fixed == "Hello world! How are you?"


def test_consecutive_duplicate_words():
    assert remove_repeated_words("this is the the test") == "this is the test"
    assert remove_repeated_words("hum hum karenge") == "hum karenge"
    assert remove_repeated_words("no duplicates here") == "no duplicates here"


def test_hinglish_normalization():
    # Crucial guarantee: Never translates English or Hindi, preserves mixed cadence
    sample = "aaj hum baat karenge about confidence and growth plz vdo dekho"
    norm = normalize_hinglish(sample)
    assert "confidence and growth" in norm
    assert "aaj hum baat karenge" in norm.lower()
    assert "please" in norm
    assert "video" in norm
    assert norm.startswith("Aaj")


def test_hindi_devanagari_normalization():
    devanagari = "नमस्ते दोस्तों  ।  आज हम बात करेंगे ."
    norm = normalize_hindi(devanagari)
    assert "दोस्तों।" in norm
    assert norm.endswith("करेंगे।")


def test_english_normalization():
    sample = "i dont know if it works. but cant wait!"
    norm = normalize_english(sample)
    assert "I" in norm
    assert "don't" in norm
    assert "can't" in norm
    assert "But" in norm


def test_unified_normalize_caption_text():
    # Hinglish
    h_text = "  i think yeh bohot acha hai  "
    assert normalize_caption_text(h_text, "hinglish") == "I think yeh bohot acha hai"

    # Devanagari
    hi_text = "यह एक परीक्षण है  ।"
    assert normalize_caption_text(hi_text, "hi") == "यह एक परीक्षण है।"

    # English
    en_text = "im going to the studio  ."
    assert normalize_caption_text(en_text, "en") == "I'm going to the studio."


def test_grouping_multiline_balance():
    grouper = CaptionGroupingService()
    long_text = "This is a longer sentence that definitely should be split across two lines for readability"
    balanced = grouper.balance_multiline_text(long_text, max_chars_per_line=40)
    lines = balanced.split("\n")
    assert len(lines) == 2
    # Ensure neither line is excessively empty
    assert len(lines[0]) > 20
    assert len(lines[1]) > 20

