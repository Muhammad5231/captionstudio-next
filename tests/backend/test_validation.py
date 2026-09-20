import pytest
from pathlib import Path
from apps.api.app.services.media.validator import media_validator


def test_validate_subtitle_extensions(tmp_path):
    # Test valid SRT
    srt_file = tmp_path / "test.srt"
    srt_file.write_text("1\n00:00:01,000 --> 00:00:02,000\nHello", encoding="utf-8")

    res = media_validator.validate_subtitle_file(
        file_path=srt_file,
        original_filename="test.srt",
        mime_type="application/x-subrip",
        file_size_bytes=srt_file.stat().st_size,
    )
    assert res.is_valid is True
    assert res.error_message is None

    # Test invalid extension (.exe)
    exe_file = tmp_path / "test.exe"
    exe_file.write_bytes(b"MZ12345")
    res_invalid = media_validator.validate_subtitle_file(
        file_path=exe_file,
        original_filename="test.exe",
        mime_type="application/octet-stream",
        file_size_bytes=exe_file.stat().st_size,
    )
    assert res_invalid.is_valid is False
    assert "Unsupported subtitle format" in res_invalid.error_message


def test_validate_video_invalid_magic(tmp_path):
    # Dangerous file with fake .mp4 extension but Windows executable header
    fake_video = tmp_path / "fake.mp4"
    fake_video.write_bytes(b"MZ\x90\x00this_is_an_executable")

    res = media_validator.validate_video_file(
        file_path=fake_video,
        original_filename="fake.mp4",
        mime_type="video/mp4",
        file_size_bytes=fake_video.stat().st_size,
    )
    assert res.is_valid is False
    assert "binary signature detected" in res.error_message.lower()


def test_validate_oversized_file(tmp_path):
    large_file = tmp_path / "oversized.mp4"
    # Create empty file but pass oversized file_size_bytes
    large_file.write_bytes(b"\x00" * 1024)

    res = media_validator.validate_video_file(
        file_path=large_file,
        original_filename="oversized.mp4",
        mime_type="video/mp4",
        file_size_bytes=600 * 1024 * 1024,  # 600MB > 500MB limit
    )
    assert res.is_valid is False
    assert "exceeds maximum allowed size" in res.error_message

