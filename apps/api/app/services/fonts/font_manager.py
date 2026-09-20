from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger


class FontInfo(BaseModel):
    family: str
    filename: str
    file_path: str
    postscript_name: str
    category: str = "sans-serif"  # sans-serif, serif, display, monospace


class FontManager:
    """
    Manages local font discovery and registration for FFmpeg / libass subtitle rendering
    and web preview typography parity.
    """

    def __init__(self, fonts_dir: Optional[Path] = None):
        self._fonts_dir = (fonts_dir or settings.data_dir / "fonts").resolve()
        self._fonts_dir.mkdir(parents=True, exist_ok=True)
        self._font_registry: Dict[str, FontInfo] = {}
        self._fallback_map: Dict[str, str] = {
            "montserrat": "Arial",
            "inter": "Segoe UI",
            "roboto": "Arial",
            "anton": "Impact",
            "bebas neue": "Impact",
            "rubik": "Trebuchet MS",
            "poppins": "Segoe UI",
            "oswald": "Impact",
            "sf pro display": "Segoe UI",
            "helvetica": "Arial",
        }
        self.scan_fonts()

    @property
    def fonts_dir(self) -> Path:
        return self._fonts_dir

    def scan_fonts(self) -> Dict[str, FontInfo]:
        """Scan data/fonts for .ttf and .otf files and register them."""
        self._font_registry.clear()

        # Known mapping for discovered filenames in data/fonts
        known_families = {
            "arial.ttf": ("Arial", "sans-serif"),
            "arial-bold.ttf": ("Arial", "sans-serif"),
            "impact.ttf": ("Impact", "display"),
            "segoeui.ttf": ("Segoe UI", "sans-serif"),
            "segoeui-bold.ttf": ("Segoe UI", "sans-serif"),
            "trebuchetms.ttf": ("Trebuchet MS", "sans-serif"),
            "trebuchetms-bold.ttf": ("Trebuchet MS", "sans-serif"),
            "tahoma.ttf": ("Tahoma", "sans-serif"),
            "tahoma-bold.ttf": ("Tahoma", "sans-serif"),
            "georgia.ttf": ("Georgia", "serif"),
            "georgia-bold.ttf": ("Georgia", "serif"),
            "verdana.ttf": ("Verdana", "sans-serif"),
            "verdana-bold.ttf": ("Verdana", "sans-serif"),
            "timesnewroman.ttf": ("Times New Roman", "serif"),
            "timesnewroman-bold.ttf": ("Times New Roman", "serif"),
        }

        for file in self._fonts_dir.iterdir():
            if file.is_file() and file.suffix.lower() in (".ttf", ".otf"):
                lower_name = file.name.lower()
                if lower_name in known_families:
                    family, category = known_families[lower_name]
                else:
                    family = file.stem.replace("-Bold", "").replace("-Regular", "")
                    category = "sans-serif"

                info = FontInfo(
                    family=family,
                    filename=file.name,
                    file_path=str(file.resolve()),
                    postscript_name=file.stem,
                    category=category,
                )
                self._font_registry[family.lower()] = info

        logger.info("FontManager loaded %d local fonts from %s", len(self._font_registry), self._fonts_dir)
        return self._font_registry

    def resolve_font_name(self, requested_font: str) -> str:
        """
        Resolves a requested font family to an existing local font name for libass/FFmpeg.
        If the exact font isn't in the registry, checks fallback map or defaults to 'Arial'.
        """
        clean = requested_font.strip()
        lower = clean.lower()

        if lower in self._font_registry:
            return self._font_registry[lower].family

        if lower in self._fallback_map:
            fallback = self._fallback_map[lower]
            if fallback.lower() in self._font_registry:
                return fallback

        # Default fallback
        return "Arial"

    def list_available_fonts(self) -> List[FontInfo]:
        """Returns list of all available fonts."""
        return list(self._font_registry.values())


font_manager = FontManager()

