from pathlib import Path
from apps.api.app.services.subtitles.srt_parser import SRTParser
from apps.api.app.services.subtitles.vtt_parser import VTTParser
from apps.api.app.services.subtitles.ass_parser import ASSParser
from apps.api.app.services.subtitles.txt_parser import TXTParser
from apps.api.app.services.subtitles.subtitle_service import subtitle_service

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"


def test_srt_parser():
    content = (FIXTURES_DIR / "sample.srt").read_text(encoding="utf-8")
    parser = SRTParser()
    result = parser.parse(content)

    assert result.format == "SRT"
    assert result.has_timing is True
    assert result.requires_alignment is False
    assert len(result.segments) == 2

    # Segment 1: 00:00:01,000 --> 00:00:02,500
    seg1 = result.segments[0]
    assert seg1.start == 1.0
    assert seg1.end == 2.5
    assert seg1.text == "Hello world"
    assert len(seg1.words) == 2
    assert seg1.words[0].word == "Hello"
    assert seg1.words[1].word == "world"


def test_vtt_parser():
    content = (FIXTURES_DIR / "sample.vtt").read_text(encoding="utf-8")
    parser = VTTParser()
    result = parser.parse(content)

    assert result.format == "VTT"
    assert result.has_timing is True
    assert len(result.segments) == 2

    seg1 = result.segments[0]
    assert seg1.start == 1.0
    assert seg1.end == 3.0
    assert "Hello world WebVTT test." in seg1.text
    # Voice tags <v Speaker> should be stripped
    assert "<v" not in seg1.text


def test_ass_parser():
    content = (FIXTURES_DIR / "sample.ass").read_text(encoding="utf-8")
    parser = ASSParser()
    result = parser.parse(content)

    assert result.format == "ASS"
    assert result.has_timing is True
    assert len(result.segments) == 2

    seg1 = result.segments[0]
    assert seg1.start == 1.0
    assert seg1.end == 3.0
    assert "Hello from ASS subtitles!" in seg1.text
    # Formatting tags {\b1} should be stripped
    assert "{\\" not in seg1.text


def test_txt_parser():
    content = (FIXTURES_DIR / "sample.txt").read_text(encoding="utf-8")
    parser = TXTParser()
    result = parser.parse(content)

    assert result.format == "TXT"
    assert result.has_timing is False
    assert result.requires_alignment is True
    assert len(result.segments) == 0
    assert result.warning is not None
    assert "Plain text file has no timing data" in result.warning


def test_subtitle_service_dispatch():
    srt_res = subtitle_service.parse_file(FIXTURES_DIR / "sample.srt")
    assert srt_res.format == "SRT"

    vtt_res = subtitle_service.parse_file(FIXTURES_DIR / "sample.vtt")
    assert vtt_res.format == "VTT"

    ass_res = subtitle_service.parse_file(FIXTURES_DIR / "sample.ass")
    assert ass_res.format == "ASS"

    txt_res = subtitle_service.parse_file(FIXTURES_DIR / "sample.txt")
    assert txt_res.format == "TXT"

