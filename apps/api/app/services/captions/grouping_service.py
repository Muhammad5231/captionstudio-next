import re
from typing import List, Optional
from apps.api.app.services.transcription.base import TimedWord, TimedSegment


class GroupingOptions:
    def __init__(
        self,
        max_words_per_segment: int = 4,
        max_chars_per_segment: int = 36,
        max_duration_seconds: float = 3.0,
        split_on_punctuation: bool = True,
        min_gap_seconds_to_split: float = 0.40,
    ):
        self.max_words_per_segment = max_words_per_segment
        self.max_chars_per_segment = max_chars_per_segment
        self.max_duration_seconds = max_duration_seconds
        self.split_on_punctuation = split_on_punctuation
        self.min_gap_seconds_to_split = min_gap_seconds_to_split


TERMINAL_PUNCTUATION = re.compile(r"[.?!,;:।]$")


class CaptionGroupingService:
    """
    Intelligent caption grouping engine.
    Transforms raw word streams into visually balanced, human-readable caption segments.
    Applies punctuation boundaries, pause detection, reading cadence, and line length limits.
    """

    def group_words(
        self,
        words: List[TimedWord],
        options: Optional[GroupingOptions] = None,
    ) -> List[TimedSegment]:
        if not words:
            return []

        opts = options or GroupingOptions()
        segments: List[TimedSegment] = []
        current_words: List[TimedWord] = []

        for idx, word in enumerate(words):
            if not current_words:
                current_words.append(word)
                continue

            prev_word = current_words[-1]
            seg_start = current_words[0].start
            current_duration = word.end - seg_start
            current_char_count = sum(len(w.word) for w in current_words) + len(current_words) - 1

            # Decision criteria for splitting into a new segment:
            # 1. Significant silence/pause between words
            time_gap = word.start - prev_word.end
            has_pause = time_gap >= opts.min_gap_seconds_to_split

            # 2. Terminal punctuation on previous word
            ends_with_punct = opts.split_on_punctuation and bool(
                TERMINAL_PUNCTUATION.search(prev_word.word.strip())
            )

            # 3. Maximum word count reached
            exceeds_word_limit = len(current_words) >= opts.max_words_per_segment

            # 4. Maximum character length reached
            exceeds_char_limit = current_char_count >= opts.max_chars_per_segment

            # 5. Maximum duration exceeded
            exceeds_duration = current_duration >= opts.max_duration_seconds

            should_split = (
                has_pause
                or ends_with_punct
                or exceeds_word_limit
                or exceeds_char_limit
                or exceeds_duration
            )

            if should_split:
                seg_text = " ".join(w.word for w in current_words).strip()
                segments.append(
                    TimedSegment(
                        start=round(current_words[0].start, 3),
                        end=round(current_words[-1].end, 3),
                        text=seg_text,
                        words=list(current_words),
                    )
                )
                current_words = [word]
            else:
                current_words.append(word)

        # Flush remaining words
        if current_words:
            seg_text = " ".join(w.word for w in current_words).strip()
            segments.append(
                TimedSegment(
                    start=round(current_words[0].start, 3),
                    end=round(current_words[-1].end, 3),
                    text=seg_text,
                    words=list(current_words),
                )
            )

        return segments

    def group_raw_segments(
        self,
        raw_segments: List[TimedSegment],
        options: Optional[GroupingOptions] = None,
    ) -> List[TimedSegment]:
        """
        Flattens words across raw Whisper segments and runs the intelligent grouper.
        """
        all_words: List[TimedWord] = []
        for seg in raw_segments:
            if seg.words:
                all_words.extend(seg.words)
            else:
                # Fallback to word interpolation if segment lacked word timestamps
                from apps.api.app.services.subtitles.base import interpolate_word_timestamps
                all_words.extend(interpolate_word_timestamps(seg.start, seg.end, seg.text))

        if not all_words:
            return raw_segments

        return self.group_words(all_words, options)


caption_grouping_service = CaptionGroupingService()
