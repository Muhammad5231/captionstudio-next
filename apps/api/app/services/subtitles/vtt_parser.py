import re
from typing import List
from apps.api.app.services.subtitles.base import (
    BaseSubtitleParser,
    ParsedSubtitleResult,
    interpolate_word_timestamps,
)
from apps.api.app.services.transcription.base import TimedSegment
from apps.api.app.services.subtitles.srt_parser import parse_timestamp_srt


class VTTParser(BaseSubtitleParser):
    def parse(self, file_content: str) -> ParsedSubtitleResult:
        normalized = file_content.replace("\r\n", "\n").replace("\r", "\n")
        blocks = re.split(r"\n\s*\n", normalized.strip())

        segments: List[TimedSegment] = []
        time_pattern = re.compile(
            r"(\d{1,2}:)?(\d{2}:\d{2}[\.,]\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{2}:\d{2}[\.,]\d{1,3})"
        )

        for block in blocks:
            lines = [line.strip() for line in block.split("\n") if line.strip()]
            if not lines:
                continue
            if lines[0].startswith("WEBVTT") or lines[0].startswith("NOTE"):
                continue

            time_match = None
            text_start_idx = 0

            for idx, line in enumerate(lines):
                match = time_pattern.search(line)
                if match:
                    time_match = match
                    text_start_idx = idx + 1
                    # Extract timestamp strings before any WebVTT cue settings (like align:start)
                    raw_line = line.split("-->")
                    start_str = raw_line[0].strip()
                    end_str = raw_line[1].strip().split(" ")[0]
                    break

            if not time_match:
                continue

            start_sec = parse_timestamp_srt(start_str)
            end_sec = parse_timestamp_srt(end_str)

            text_lines = lines[text_start_idx:]
            raw_text = " ".join(text_lines)
            # Remove VTT voice spans <v Name>, timestamps <00:01.000>, and tags
            clean_text = re.sub(r"<[^>]+>", "", raw_text).strip()

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

        return ParsedSubtitleResult(
            format="VTT",
            has_timing=True,
            requires_alignment=False,
            segments=segments,
        )
