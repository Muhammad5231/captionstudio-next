import re
from typing import List
from apps.api.app.services.subtitles.base import (
    BaseSubtitleParser,
    ParsedSubtitleResult,
    interpolate_word_timestamps,
)
from apps.api.app.services.transcription.base import TimedSegment


def parse_timestamp_srt(ts_str: str) -> float:
    # Format: HH:MM:SS,mmm or HH:MM:SS.mmm
    clean = ts_str.strip().replace(",", ".")
    parts = clean.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(h) * 3600 + int(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return int(m) * 60 + float(s)
    return float(clean)


class SRTParser(BaseSubtitleParser):
    def parse(self, file_content: str) -> ParsedSubtitleResult:
        normalized = file_content.replace("\r\n", "\n").replace("\r", "\n")
        blocks = re.split(r"\n\s*\n", normalized.strip())

        segments: List[TimedSegment] = []
        time_pattern = re.compile(
            r"(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})"
        )

        for block in blocks:
            lines = [line.strip() for line in block.split("\n") if line.strip()]
            if not lines:
                continue

            time_match = None
            text_start_idx = 0

            for idx, line in enumerate(lines):
                match = time_pattern.search(line)
                if match:
                    time_match = match
                    text_start_idx = idx + 1
                    break

            if not time_match:
                continue

            start_sec = parse_timestamp_srt(time_match.group(1))
            end_sec = parse_timestamp_srt(time_match.group(2))

            text_lines = lines[text_start_idx:]
            raw_text = " ".join(text_lines)
            # Remove HTML tags if present (e.g. <i>, </b>, <font>)
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
            format="SRT",
            has_timing=True,
            requires_alignment=False,
            segments=segments,
        )

