import re
from typing import List
from apps.api.app.services.subtitles.base import (
    BaseSubtitleParser,
    ParsedSubtitleResult,
    interpolate_word_timestamps,
)
from apps.api.app.services.transcription.base import TimedSegment
from apps.api.app.services.subtitles.srt_parser import parse_timestamp_srt


class ASSParser(BaseSubtitleParser):
    def parse(self, file_content: str) -> ParsedSubtitleResult:
        normalized = file_content.replace("\r\n", "\n").replace("\r", "\n")
        lines = normalized.split("\n")

        segments: List[TimedSegment] = []
        in_events = False
        format_order = []

        for line in lines:
            line_s = line.strip()
            if not line_s:
                continue

            if line_s.startswith("[Events]"):
                in_events = True
                continue
            elif line_s.startswith("[") and in_events:
                in_events = False
                continue

            if in_events:
                if line_s.startswith("Format:"):
                    format_order = [f.strip().lower() for f in line_s[7:].split(",")]
                    continue

                if line_s.startswith("Dialogue:"):
                    raw_val = line_s[9:].strip()
                    # ASS has commas inside text, so only split up to the number of format fields - 1
                    num_fields = len(format_order) if format_order else 10
                    parts = raw_val.split(",", num_fields - 1)

                    start_idx = format_order.index("start") if "start" in format_order else 1
                    end_idx = format_order.index("end") if "end" in format_order else 2
                    text_idx = format_order.index("text") if "text" in format_order else (len(parts) - 1)

                    if len(parts) > max(start_idx, end_idx, text_idx):
                        start_str = parts[start_idx].strip()
                        end_str = parts[end_idx].strip()
                        raw_text = parts[text_idx].strip()

                        # Strip ASS override tags like {\pos(100,200)\b1\c&H00FFFF&}
                        clean_text = re.sub(r"\{[^}]*\}", "", raw_text)
                        # Replace \N or \n with space
                        clean_text = re.sub(r"\\[Nn]", " ", clean_text).strip()

                        start_sec = parse_timestamp_srt(start_str)
                        end_sec = parse_timestamp_srt(end_str)

                        if clean_text and end_sec > start_sec:
                            words = interpolate_word_timestamps(start_sec, end_sec, clean_text)
                            segments.append(
                                TimedSegment(
                                    start=round(start_sec, 3),
                                    end=round(end_sec, 3),
                                    text=clean_text,
                                    words=words,
                                )
                            )

        # Sort segments chronologically
        segments.sort(key=lambda s: s.start)

        return ParsedSubtitleResult(
            format="ASS",
            has_timing=True,
            requires_alignment=False,
            segments=segments,
        )
