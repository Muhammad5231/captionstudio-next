from apps.api.app.services.subtitles.base import (
    BaseSubtitleParser,
    ParsedSubtitleResult,
)


class TXTParser(BaseSubtitleParser):
    """
    Plain text parser. TXT files lack timing information.
    Honestly marks the result as un-timed and requiring speech-to-text alignment,
    without inventing fake timestamps.
    """

    def parse(self, file_content: str) -> ParsedSubtitleResult:
        clean_text = file_content.strip()
        return ParsedSubtitleResult(
            format="TXT",
            has_timing=False,
            requires_alignment=True,
            segments=[],
            raw_text=clean_text,
            warning="Plain text file has no timing data. Video alignment or transcription is required.",
        )

