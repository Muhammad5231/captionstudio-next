from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from apps.api.app.database.session import get_db
from apps.api.app.schemas.style import (
    StyleSummary,
    StyleDetail,
    StylePreviewRequest,
)
from apps.api.app.services.styles.style_service import style_service

router = APIRouter(prefix="/styles", tags=["Styles"])


@router.get("", response_model=List[StyleSummary])
def list_public_styles(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List all active published caption styles available to creators.
    """
    return style_service.list_styles(db, category=category, status_filter="PUBLISHED")


@router.get("/{style_id}", response_model=StyleDetail)
def get_public_style(
    style_id: str,
    db: Session = Depends(get_db),
):
    """
    Get specification and details for a specific caption style.
    """
    style = style_service.get_style(db, style_id=style_id)
    if not style or style.status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="Caption style not found")
    return style


@router.post("/preview")
def preview_arbitrary_style(
    payload: StylePreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Generate live preview and render specification from Python style code.
    """
    return style_service.preview_style(db, payload)


@router.post("/{style_id}/preview")
def preview_style_by_id(
    style_id: str,
    payload: StylePreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Generate live preview and render specification for a specific style ID.
    """
    return style_service.preview_style(db, payload, style_id=style_id)
