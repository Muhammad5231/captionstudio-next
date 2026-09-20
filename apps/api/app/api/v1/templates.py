from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from apps.api.app.schemas.render_spec import StyleTemplate, StyleCategory
from apps.api.app.services.templates.template_service import template_service

router = APIRouter()


@router.get("/templates", response_model=List[StyleTemplate])
def list_templates(
    category: Optional[StyleCategory] = Query(None, description="Filter by style category"),
    search: Optional[str] = Query(None, description="Search keyword in name/description/tags"),
):
    """
    Returns all 60+ data-driven caption style templates with optional category filtering and search.
    """
    return template_service.list_templates(category=category, search=search)


@router.get("/templates/{template_id}", response_model=StyleTemplate)
def get_template(template_id: str):
    """
    Retrieves the complete CaptionRenderSpec and metadata for a specific style template.
    """
    template = template_service.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Style template not found")
    return template

