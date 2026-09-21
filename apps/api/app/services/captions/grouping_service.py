import re
from typing import List, Optional
from apps.api.app.services.transcription.base import TimedWord, TimedSegment


from apps.api.app.services.subtitles.normalization import normalize_caption_text


class GroupingOptions:
    def __init__(
        self,
        max_words_per_segment: int = 4,
        max_chars_per_segment: int = 36,
        max_duration_seconds: float = 3.0,
        split_on_punctuation: bool = True,
        min_gap_seconds_to_split: float = 0.40,
        language: str = "auto",
        normalize: bool = False,
        balance_multiline: bool = False,
        max_chars_per_line: int = 34,
    ):
        self.max_words_per_segment = max_words_per_segment
        self.max_chars_per_segment = max_chars_per_segment
        self.max_duration_seconds = max_duration_seconds
        self.split_on_punctuation = split_on_punctuation
        self.min_gap_seconds_to_split = min_gap_seconds_to_split
        self.language = language
        self.normalize = normalize
        self.balance_multiline = balance_multiline
        self.max_chars_per_line = max_chars_per_line


TERMINAL_PUNCTUATION = re.compile(r"[.?!,;:।]$")


class CaptionGroupingService:
    """
    Intelligent caption grouping engine.
    Transforms raw word streams into visually balanced, human-readable caption segments.
    Applies punctuation boundaries, pause detection, reading cadence, and line length limits.
    """

    def balance_multiline_text(self, text: str, max_chars_per_line: int = 34) -> str:
        """
        Balances longer segment text into a clean 2-line layout at the optimal word boundary.
        """
        words = text.split()
        if len(words) <= 3 or len(text) <= max_chars_per_line:
            return text

        mid_char = len(text) // 2
        best_split_idx = 1
        min_dist = float("inf")
        cum_len = 0

        for i in range(len(words) - 1):
            cum_len += len(words[i]) + 1
            dist = abs(cum_len - mid_char)
            if dist < min_dist:
                min_dist = dist
                best_split_idx = i + 1

        line1 = " ".join(words[:best_split_idx])
        line2 = " ".join(words[best_split_idx:])
        return f"{line1}\n{line2}"

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

        def build_segment_text(word_list: List[TimedWord]) -> str:
            text = " ".join(w.word for w in word_list).strip()
            if opts.normalize:
                text = normalize_caption_text(text, language=opts.language)
            if opts.balance_multiline:
                text = self.balance_multiline_text(text, opts.max_chars_per_line)
            return text

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
                seg_text = build_segment_text(current_words)
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
            seg_text = build_segment_text(current_words)
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

