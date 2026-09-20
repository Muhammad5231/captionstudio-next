from fastapi import APIRouter
from apps.api.app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    ffmpeg_ok = False
    ffprobe_ok = False
    try:
        settings.get_ffmpeg_bin()
        ffmpeg_ok = True
    except Exception:
        pass

    try:
        settings.get_ffprobe_bin()
        ffprobe_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "media_engine": {
            "ffmpeg": ffmpeg_ok,
            "ffprobe": ffprobe_ok,
        },
        "whisper": {
            "model": settings.WHISPER_MODEL,
            "device": settings.WHISPER_DEVICE,
        }
    }
