import os
import shutil
from pathlib import Path
from typing import List, Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

# Base directory: project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "CaptionStudio"
    APP_ENV: str = "development"
    DEBUG: bool = True

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug", "dev")
        return bool(v)

    # Server
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./data/database/captionstudio.db")

    # Storage & Data
    STORAGE_ROOT: str = "./storage"
    DATA_DIR: str = "./data"

    # Local Media Binaries
    FFMPEG_PATH: Optional[str] = "./ffmpeg.exe"
    FFPROBE_PATH: Optional[str] = "./ffprobe.exe"

    # AI / Faster-Whisper
    WHISPER_MODEL: str = "base"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    WHISPER_DOWNLOAD_ROOT: str = "./data/models"

    # Validation
    MAX_UPLOAD_SIZE_MB: int = 500
    MAX_VIDEO_DURATION_MINUTES: int = 60

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def storage_path(self) -> Path:
        path = (ROOT_DIR / self.STORAGE_ROOT).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def storage_root(self) -> Path:
        return self.storage_path

    @property
    def data_dir(self) -> Path:
        path = (ROOT_DIR / self.DATA_DIR).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def database_path(self) -> Path:
        if self.DATABASE_URL.startswith("sqlite:///"):
            raw_path = self.DATABASE_URL.replace("sqlite:///", "")
            resolved = (ROOT_DIR / raw_path).resolve()
            resolved.parent.mkdir(parents=True, exist_ok=True)
            return resolved
        return Path("./data/database/captionstudio.db")

    def resolve_binary(self, binary_name: str, configured_path: Optional[str]) -> str:
        """Resolve binary from configured path, project root, or system PATH."""
        if configured_path:
            # Check relative to ROOT_DIR
            cand1 = (ROOT_DIR / configured_path).resolve()
            if cand1.is_file():
                return str(cand1)
            # Check absolute or relative to CWD
            cand2 = Path(configured_path).resolve()
            if cand2.is_file():
                return str(cand2)

        # Check project root directly
        cand_root = ROOT_DIR / f"{binary_name}.exe"
        if cand_root.is_file():
            return str(cand_root)

        cand_root_plain = ROOT_DIR / binary_name
        if cand_root_plain.is_file():
            return str(cand_root_plain)

        # Fallback to system PATH
        found = shutil.which(binary_name)
        if found:
            return found
        found_exe = shutil.which(f"{binary_name}.exe")
        if found_exe:
            return found_exe

        raise FileNotFoundError(f"Binary '{binary_name}' could not be located in workspace or system PATH.")

    def get_ffmpeg_bin(self) -> str:
        return self.resolve_binary("ffmpeg", self.FFMPEG_PATH)

    def get_ffprobe_bin(self) -> str:
        return self.resolve_binary("ffprobe", self.FFPROBE_PATH)


settings = Settings()
