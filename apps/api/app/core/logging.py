import logging
import sys
from pathlib import Path
from apps.api.app.core.config import settings

LOG_FORMAT = "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging():
    log_dir = settings.storage_path / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "captionstudio.log"

    handlers = [
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(str(log_file), encoding="utf-8"),
    ]

    level = logging.DEBUG if settings.DEBUG else logging.INFO

    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        handlers=handlers,
        force=True,
    )

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("CaptionStudio")
    logger.info("Logging initialized. Output file: %s", log_file)
    return logger


logger = logging.getLogger("CaptionStudio")

