from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from apps.api.app.database.session import get_db
from apps.api.app.database.models import AdminSession
from apps.api.app.api.deps import require_admin
from apps.api.app.schemas.style import (
    StyleSummary,
    StyleDetail,
    StyleCreateRequest,
    StyleUpdateRequest,
    StyleValidateRequest,
    StyleValidateResponse,
    StylePreviewRequest,
)
from apps.api.app.services.styles.style_service import style_service

router = APIRouter(prefix="/admin/styles", tags=["Admin Style Management"])


@router.get("", response_model=List[StyleSummary])
def list_admin_styles(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    List all caption styles (including drafts and archived) for admin control.
    """
    return style_service.list_styles(db, category=category, status_filter=status_filter)


@router.get("/{style_id}", response_model=StyleDetail)
def get_admin_style(
    style_id: str,
    version: Optional[int] = Query(None),
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get complete details of a style, its Python code, render spec, and version history.
    """
    style = style_service.get_style(db, style_id=style_id, version=version)
    if not style:
        raise HTTPException(status_code=404, detail="Caption style not found")
    return style


@router.post("/validate", response_model=StyleValidateResponse)
def validate_style_code(
    payload: StyleValidateRequest,
    session: AdminSession = Depends(require_admin),
):
    """
    Validate Python style code within the isolated sandbox runtime.
    """
    return style_service.validate_code(payload)


@router.post("", response_model=StyleDetail, status_code=status.HTTP_201_CREATED)
def create_new_style(
    payload: StyleCreateRequest,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new caption style in draft status.
    """
    try:
        return style_service.create_style(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{style_id}", response_model=StyleDetail)
def update_style(
    style_id: str,
    payload: StyleUpdateRequest,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Update a style draft or create a new version with modified Python code.
    """
    try:
        return style_service.update_style(db, style_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{style_id}/preview")
def preview_admin_style(
    style_id: str,
    payload: StylePreviewRequest,
    session: AdminSession = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Generate live preview for the style editor.
    """
    return style_service.preview_style(db, payload, style_id=style_id)
