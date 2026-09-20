import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from apps.api.app.database.session import get_db
from apps.api.app.database.models import ProjectAsset
from apps.api.app.services.storage.local_storage import storage_service

router = APIRouter()


def send_bytes_range_requests(
    file_path: Path, request: Request, content_type: str
):
    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(file_path, media_type=content_type)

    # Format: bytes=start-end
    range_str = range_header.strip().replace("bytes=", "")
    parts = range_str.split("-")
    start = int(parts[0]) if parts[0] else 0
    end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1

    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            detail=f"Invalid byte range: {range_header}",
        )

    chunk_size = end - start + 1

    def iterfile():
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = chunk_size
            while remaining > 0:
                read_amount = min(remaining, 64 * 1024)
                data = f.read(read_amount)
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_size),
        "Content-Type": content_type,
    }

    return StreamingResponse(
        iterfile(),
        status_code=status.HTTP_206_PARTIAL_CONTENT,
        headers=headers,
    )


@router.get("/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(ProjectAsset).filter(ProjectAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {
        "id": asset.id,
        "project_id": asset.project_id,
        "type": asset.type,
        "original_filename": asset.original_filename,
        "mime_type": asset.mime_type,
        "size": asset.size,
        "duration": asset.duration,
        "width": asset.width,
        "height": asset.height,
        "created_at": asset.created_at,
    }


@router.get("/assets/{asset_id}/stream")
def stream_asset(asset_id: str, request: Request, db: Session = Depends(get_db)):
    asset = db.query(ProjectAsset).filter(ProjectAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    file_path = storage_service.resolve_key(asset.storage_key)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File on disk not found")

    return send_bytes_range_requests(file_path, request, asset.mime_type or "video/mp4")
