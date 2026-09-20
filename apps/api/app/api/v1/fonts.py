from typing import List
from fastapi import APIRouter
from apps.api.app.services.fonts.font_manager import font_manager, FontInfo

router = APIRouter()


@router.get("/fonts", response_model=List[FontInfo])
def list_fonts():
    """
    Returns the list of all registered local fonts available for ASS rendering and browser preview.
    """
    return font_manager.list_available_fonts()

