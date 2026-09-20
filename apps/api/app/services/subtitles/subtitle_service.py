from pathlib import Path
from typing import Dict, Type
from apps.api.app.services.subtitles.base import (
    BaseSubtitleParser,
    ParsedSubtitleResult,
)
from apps.api.app.services.subtitles.srt_parser import SRTParser
from apps.api.app.services.subtitles.vtt_parser import VTTParser
from apps.api.app.services.subtitles.ass_parser import ASSParser
from apps.api.app.services.subtitles.txt_parser import TXTParser


class SubtitleService:
    def __init__(self):
        self._parsers: Dict[str, BaseSubtitleParser] = {
            ".srt": SRTParser(),
            ".vtt": VTTParser(),
            ".ass": ASSParser(),
            ".txt": TXTParser(),
        }

    def parse_file(self, file_path: Path | str, original_filename: str = "") -> ParsedSubtitleResult:
        p = Path(file_path)
        ext = (Path(original_filename).suffix or p.suffix).lower()

        parser = self._parsers.get(ext)
        if not parser:
            raise ValueError(
                f"No subtitle parser available for extension '{ext}'. Supported: {list(self._parsers.keys())}"
            )

        with open(p, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        return parser.parse(content)


subtitle_service = SubtitleService()

