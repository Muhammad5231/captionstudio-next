import subprocess
from pathlib import Path
from apps.api.app.services.media.ffmpeg_service import ffmpeg_service
from apps.api.app.services.media.ffprobe_service import ffprobe_service


def test_ffmpeg_and_ffprobe_synthetic_media(tmp_path):
    # Generate a 2-second test video with audio using lavfi testsrc & sine tone
    test_video = tmp_path / "synthetic_test.mp4"
    args = [
        "-f", "lavfi", "-i", "testsrc=duration=2:size=640x360:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        str(test_video)
    ]
    ffmpeg_service.run_command(args)
    assert test_video.is_file()
    assert test_video.stat().st_size > 0

    # Probe metadata
    meta = ffprobe_service.probe(test_video)
    assert meta.has_video is True
    assert meta.has_audio is True
    assert meta.width == 640
    assert meta.height == 360
    assert meta.duration >= 1.9

    # Extract 16kHz mono WAV audio
    extracted_wav = tmp_path / "extracted.wav"
    ffmpeg_service.extract_audio(test_video, extracted_wav)
    assert extracted_wav.is_file()
    assert extracted_wav.stat().st_size > 0

    # Verify extracted audio properties
    audio_meta = ffprobe_service.probe(extracted_wav)
    assert audio_meta.has_audio is True
    assert audio_meta.audio_sample_rate == 16000
    assert audio_meta.audio_channels == 1

