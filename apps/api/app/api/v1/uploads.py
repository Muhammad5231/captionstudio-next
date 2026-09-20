import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import Project, ProjectAsset
from apps.api.app.services.storage.local_storage import storage_service
from apps.api.app.services.media.validator import media_validator
from apps.api.app.core.logging import logger

router = APIRouter()


@router.post("/uploads")
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    asset_type: str = Form(...),  # VIDEO or SUBTITLE
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    filename = file.filename or "unnamed_upload"
    mime_type = file.content_type or "application/octet-stream"

    # Save to local storage
    try:
        storage_key, file_size = storage_service.save_upload(file.file, filename)
    except Exception as e:
        logger.error("Failed to save uploaded file: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save upload: {str(e)}",
        )

    file_path = storage_service.resolve_key(storage_key)

    # Perform Multi-Level Validation
    if asset_type.upper() == "VIDEO":
        val_result = media_validator.validate_video_file(
            file_path=file_path,
            original_filename=filename,
            mime_type=mime_type,
            file_size_bytes=file_size,
        )
    elif asset_type.upper() == "SUBTITLE":
        val_result = media_validator.validate_subtitle_file(
            file_path=file_path,
            original_filename=filename,
            mime_type=mime_type,
            file_size_bytes=file_size,
        )
    else:
        storage_service.delete_file(storage_key)
        raise HTTPException(status_code=400, detail="Invalid asset_type. Must be VIDEO or SUBTITLE.")

    if not val_result.is_valid:
        # Clean up invalid file from disk
        storage_service.delete_file(storage_key)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_MEDIA",
                "message": val_result.error_message or "Validation failed",
            },
        )

    # Create Asset Record in DB
    asset = ProjectAsset(
        id=str(uuid.uuid4()),
        project_id=project.id,
        type=asset_type.upper(),
        original_filename=filename,
        mime_type=mime_type,
        size=file_size,
        storage_key=storage_key,
        duration=val_result.media_metadata.duration if val_result.media_metadata else None,
        width=val_result.media_metadata.width if val_result.media_metadata else None,
        height=val_result.media_metadata.height if val_result.media_metadata else None,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "asset": {
            "id": asset.id,
            "project_id": asset.project_id,
            "type": asset.type,
            "original_filename": asset.original_filename,
            "mime_type": asset.mime_type,
            "size": asset.size,
            "duration": asset.duration,
            "width": asset.width,
            "height": asset.height,
        }
    }

