import os
import shutil
import uuid
import re
from pathlib import Path
from typing import Optional, BinaryIO
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger


class StorageService:
    """
    Local-first storage service managing assets and temporary files.
    All storage is referenced through opaque storage keys (e.g. 'uploads/uuid_name.mp4')
    preventing raw system path exposure to client.
    """

    def __init__(self, root_path: Optional[Path] = None):
        self.root_path = root_path or settings.storage_path
        self._ensure_directories()

    def _ensure_directories(self):
        for sub in [
            "uploads",
            "projects",
            "audio",
            "subtitles",
            "thumbnails",
            "renders",
            "exports",
            "temp",
            "logs",
        ]:
            (self.root_path / sub).mkdir(parents=True, exist_ok=True)

    def sanitize_filename(self, filename: str) -> str:
        # Keep alphanumeric, dot, hyphen, underscore
        clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
        # Prevent path traversal
        clean = Path(clean).name
        return clean or "unnamed_file"

    def resolve_key(self, storage_key: str) -> Path:
        """Safely resolve a storage key to an absolute filesystem Path."""
        # Clean key
        normalized_key = storage_key.replace("\\", "/").lstrip("/")
        # Disallow directory traversal
        if ".." in normalized_key.split("/"):
            raise ValueError("Directory traversal attempt detected in storage key.")

        target = (self.root_path / normalized_key).resolve()
        if not str(target).startswith(str(self.root_path.resolve())):
            raise ValueError("Target file escapes storage root.")
        return target

    def save_upload(self, file_obj: BinaryIO, original_filename: str) -> tuple[str, int]:
        """Save an uploaded file and return (storage_key, file_size)."""
        safe_name = self.sanitize_filename(original_filename)
        unique_prefix = uuid.uuid4().hex[:12]
        filename = f"{unique_prefix}_{safe_name}"
        storage_key = f"uploads/{filename}"
        target_path = self.resolve_key(storage_key)

        size = 0
        with open(target_path, "wb") as f_out:
            while chunk := file_obj.read(1024 * 1024):  # 1MB chunks
                f_out.write(chunk)
                size += len(chunk)

        logger.info("Saved upload to key %s (%d bytes)", storage_key, size)
        return storage_key, size

    def save_bytes(self, content: bytes, folder: str, filename: str) -> str:
        safe_name = self.sanitize_filename(filename)
        storage_key = f"{folder}/{safe_name}"
        target_path = self.resolve_key(storage_key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        with open(target_path, "wb") as f_out:
            f_out.write(content)

        return storage_key

    def create_temp_path(self, suffix: str = ".tmp") -> Path:
        temp_dir = self.root_path / "temp"
        temp_dir.mkdir(parents=True, exist_ok=True)
        filename = f"tmp_{uuid.uuid4().hex}{suffix}"
        return temp_dir / filename

    def delete_file(self, storage_key: str) -> bool:
        try:
            path = self.resolve_key(storage_key)
            if path.is_file():
                path.unlink()
                return True
        except Exception as e:
            logger.error("Failed to delete %s: %s", storage_key, e)
        return False

    def cleanup_temp_files(self, max_age_seconds: int = 86400):
        """Clean temporary files older than max_age_seconds."""
        temp_dir = self.root_path / "temp"
        if not temp_dir.exists():
            return
        now = os.time() if hasattr(os, "time") else __import__("time").time()
        count = 0
        for item in temp_dir.iterdir():
            if item.is_file():
                try:
                    if now - item.stat().st_mtime > max_age_seconds:
                        item.unlink()
                        count += 1
                except Exception:
                    pass
        if count:
            logger.info("Cleaned %d expired temp files.", count)


storage_service = StorageService()

