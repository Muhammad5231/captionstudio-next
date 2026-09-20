from apps.api.app.services.captions.grouping_service import (
    CaptionGroupingService,
    GroupingOptions,
)
from apps.api.app.services.transcription.base import TimedWord


def test_caption_grouping_word_limit():
    grouper = CaptionGroupingService()
    # 8 words with small time gaps (< 0.2s)
    words = [
        TimedWord(word=f"word{i}", start=i * 0.5, end=(i * 0.5) + 0.4)
        for i in range(8)
    ]
    # Max 4 words per segment
    opts = GroupingOptions(max_words_per_segment=4, min_gap_seconds_to_split=1.0)
    segments = grouper.group_words(words, opts)

    assert len(segments) == 2
    assert len(segments[0].words) == 4
    assert len(segments[1].words) == 4
    assert segments[0].text == "word0 word1 word2 word3"
    assert segments[1].text == "word4 word5 word6 word7"


def test_caption_grouping_pause_gap():
    grouper = CaptionGroupingService()
    words = [
        TimedWord(word="Hello", start=0.0, end=0.5),
        TimedWord(word="there", start=0.6, end=1.0),
        # Big pause: 1.0 to 1.8 (0.8s gap > 0.4s default threshold)
        TimedWord(word="how", start=1.8, end=2.1),
        TimedWord(word="are", start=2.2, end=2.4),
        TimedWord(word="you", start=2.5, end=2.8),
    ]
    opts = GroupingOptions(max_words_per_segment=10, min_gap_seconds_to_split=0.4)
    segments = grouper.group_words(words, opts)

    assert len(segments) == 2
    assert segments[0].text == "Hello there"
    assert segments[1].text == "how are you"


def test_caption_grouping_punctuation():
    grouper = CaptionGroupingService()
    words = [
        TimedWord(word="Stop.", start=0.0, end=0.5),
        TimedWord(word="Look", start=0.6, end=0.9),
        TimedWord(word="around.", start=1.0, end=1.5),
    ]
    opts = GroupingOptions(
        max_words_per_segment=10,
        split_on_punctuation=True,
        min_gap_seconds_to_split=2.0,
    )
    segments = grouper.group_words(words, opts)

    assert len(segments) == 2
    assert segments[0].text == "Stop."
    assert segments[1].text == "Look around."

