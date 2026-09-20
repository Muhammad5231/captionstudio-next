import pytest
from apps.api.app.services.fonts.font_manager import font_manager


def test_font_manager_lists_fonts():
    fonts = font_manager.list_available_fonts()
    assert len(fonts) >= 5, f"Expected at least 5 local fonts, found {len(fonts)}"
    families = [f.family for f in fonts]
    assert "Arial" in families


def test_font_resolution_and_fallbacks():
    # Known alias fallback: Montserrat -> Arial
    res = font_manager.resolve_font_name("Montserrat")
    assert res in ("Arial", "Montserrat")

    # Direct resolution: Arial -> Arial
    assert font_manager.resolve_font_name("Arial") == "Arial"

    # Unknown font defaults to Arial
    assert font_manager.resolve_font_name("UnknownFont123") == "Arial"

