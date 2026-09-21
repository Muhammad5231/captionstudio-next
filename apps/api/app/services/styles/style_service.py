import hashlib
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from apps.api.app.database.models import CaptionStyle, CaptionStyleVersion, utc_now
from apps.api.app.schemas.style import (
    StyleSummary,
    StyleDetail,
    StyleVersionSummary,
    StyleCreateRequest,
    StyleUpdateRequest,
    StyleValidateRequest,
    StyleValidateResponse,
    StylePreviewRequest,
)
from apps.api.app.styles.sandbox import style_sandbox
from apps.api.app.styles.sdk import VideoContext
from apps.api.app.services.rendering.ass_generator import ASSRenderer
from apps.api.app.schemas.render_spec import CaptionRenderSpec
from apps.api.app.core.logging import logger
from apps.api.app.core.config import ROOT_DIR

BUILTIN_STYLES_DIR = ROOT_DIR / "styles" / "builtin"


class StyleService:
    """
    Manages caption styles, versioned Python styling code, sandbox validation,
    built-in style seeding, and preview generation.
    """

    def __init__(self):
        self._cached_metadata: Dict[str, Dict[str, Any]] = {}
        self._load_cached_metadata()

    def _load_cached_metadata(self):
        if not BUILTIN_STYLES_DIR.exists():
            return
        for d in BUILTIN_STYLES_DIR.iterdir():
            if d.is_dir():
                meta_file = d / "metadata.json"
                if meta_file.exists():
                    try:
                        data = json.loads(meta_file.read_text(encoding="utf-8"))
                        self._cached_metadata[data["id"]] = data
                    except Exception as e:
                        logger.warning("Failed to load style metadata from %s: %s", meta_file, e)

    def seed_builtin_styles(self, db: Session):
        """Scans styles/builtin and seeds the 15 built-in styles and versions into SQLite."""
        if not BUILTIN_STYLES_DIR.exists():
            return

        for d in sorted(BUILTIN_STYLES_DIR.iterdir()):
            if not d.is_dir():
                continue

            style_file = d / "style.py"
            meta_file = d / "metadata.json"
            if not style_file.exists() or not meta_file.exists():
                continue

            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                code = style_file.read_text(encoding="utf-8")
                style_id = meta["id"]
                checksum = hashlib.sha256(code.encode("utf-8")).hexdigest()

                existing = db.query(CaptionStyle).filter(CaptionStyle.id == style_id).first()
                if not existing:
                    # Execute style in sandbox to verify and extract default render_spec
                    ok, _, spec_dict, err, _ = style_sandbox.execute_style(code)
                    if not ok:
                        logger.error("Built-in style %s failed sandbox check: %s", style_id, err)
                        continue

                    style_rec = CaptionStyle(
                        id=style_id,
                        name=meta.get("name", style_id),
                        category=meta.get("category", "VIRAL_BOLD"),
                        description=meta.get("description", ""),
                        status="PUBLISHED",
                        is_builtin=True,
                        current_version=1,
                    )
                    db.add(style_rec)
                    db.flush()

                    version_rec = CaptionStyleVersion(
                        style_id=style_id,
                        version=1,
                        python_code=code,
                        render_spec_schema=json.dumps(spec_dict) if spec_dict else None,
                        checksum=checksum,
                        published_at=utc_now(),
                    )
                    db.add(version_rec)
                    db.commit()
                    logger.info("Seeded built-in style: %s (%s)", style_id, meta.get("name"))
                else:
                    # Ensure version 1 exists
                    v1 = (
                        db.query(CaptionStyleVersion)
                        .filter(
                            CaptionStyleVersion.style_id == style_id,
                            CaptionStyleVersion.version == 1,
                        )
                        .first()
                    )
                    if not v1:
                        ok, _, spec_dict, _, _ = style_sandbox.execute_style(code)
                        version_rec = CaptionStyleVersion(
                            style_id=style_id,
                            version=1,
                            python_code=code,
                            render_spec_schema=json.dumps(spec_dict) if spec_dict else None,
                            checksum=checksum,
                            published_at=utc_now(),
                        )
                        db.add(version_rec)
                        db.commit()
            except Exception as e:
                logger.error("Failed to seed built-in style %s: %s", d.name, e)
                db.rollback()

    def list_styles(
        self,
        db: Session,
        category: Optional[str] = None,
        status_filter: Optional[str] = "PUBLISHED",
    ) -> List[StyleSummary]:
        query = db.query(CaptionStyle)
        if status_filter:
            query = query.filter(CaptionStyle.status == status_filter.upper())
        if category:
            query = query.filter(CaptionStyle.category == category.upper())

        styles = query.order_by(CaptionStyle.name.asc()).all()
        style_ids = [s.id for s in styles]
        v_map = {}
        if style_ids:
            versions = (
                db.query(CaptionStyleVersion)
                .filter(CaptionStyleVersion.style_id.in_(style_ids))
                .all()
            )
            for v in versions:
                v_map[(v.style_id, v.version)] = v

        results: List[StyleSummary] = []
        for s in styles:
            meta = self._cached_metadata.get(s.id, {})
            v_rec = v_map.get((s.id, s.current_version))
            render_spec = None
            if v_rec and v_rec.render_spec_schema:
                try:
                    render_spec = json.loads(v_rec.render_spec_schema)
                except Exception:
                    pass

            results.append(
                StyleSummary(
                    id=s.id,
                    name=s.name,
                    category=s.category,
                    description=s.description,
                    status=s.status,
                    is_builtin=s.is_builtin,
                    current_version=s.current_version,
                    tags=meta.get("tags", []),
                    thumbnail_css=meta.get("thumbnail_css", None),
                    render_spec=render_spec,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
            )
        return results

    def get_style(
        self,
        db: Session,
        style_id: str,
        version: Optional[int] = None,
    ) -> Optional[StyleDetail]:
        style = db.query(CaptionStyle).filter(CaptionStyle.id == style_id).first()
        if not style:
            return None

        target_version = version or style.current_version
        v_rec = (
            db.query(CaptionStyleVersion)
            .filter(
                CaptionStyleVersion.style_id == style_id,
                CaptionStyleVersion.version == target_version,
            )
            .first()
        )

        all_versions = (
            db.query(CaptionStyleVersion)
            .filter(CaptionStyleVersion.style_id == style_id)
            .order_by(desc(CaptionStyleVersion.version))
            .all()
        )

        python_code = v_rec.python_code if v_rec else ""
        render_spec = None
        if v_rec and v_rec.render_spec_schema:
            try:
                render_spec = json.loads(v_rec.render_spec_schema)
            except Exception:
                pass

        if not render_spec and python_code:
            ok, _, spec, _, _ = style_sandbox.execute_style(python_code)
            if ok:
                render_spec = spec

        return StyleDetail(
            id=style.id,
            name=style.name,
            category=style.category,
            description=style.description,
            status=style.status,
            is_builtin=style.is_builtin,
            current_version=style.current_version,
            python_code=python_code,
            render_spec=render_spec,
            versions=[
                StyleVersionSummary(
                    version=v.version,
                    created_at=v.created_at,
                    published_at=v.published_at,
                    checksum=v.checksum,
                )
                for v in all_versions
            ],
            created_at=style.created_at,
            updated_at=style.updated_at,
        )

    def validate_code(
        self,
        req: StyleValidateRequest,
    ) -> StyleValidateResponse:
        video = VideoContext(width=req.video_width, height=req.video_height)
        ok, _, spec, err, elapsed = style_sandbox.execute_style(req.python_code, video)
        return StyleValidateResponse(
            is_valid=ok,
            error=err,
            render_spec=spec,
            execution_time_ms=round(elapsed, 2),
        )

    def create_style(
        self,
        db: Session,
        req: StyleCreateRequest,
    ) -> StyleDetail:
        # Check ID existence
        existing = db.query(CaptionStyle).filter(CaptionStyle.id == req.id).first()
        if existing:
            raise ValueError(f"Style with ID '{req.id}' already exists.")

        # Validate code
        ok, _, spec_dict, err, _ = style_sandbox.execute_style(req.python_code)
        if not ok:
            raise ValueError(f"Style validation failed: {err}")

        checksum = hashlib.sha256(req.python_code.encode("utf-8")).hexdigest()
        style_rec = CaptionStyle(
            id=req.id,
            name=req.name,
            category=req.category,
            description=req.description or "",
            status="PUBLISHED",
            is_builtin=False,
            current_version=1,
        )
        db.add(style_rec)
        db.flush()

        version_rec = CaptionStyleVersion(
            style_id=req.id,
            version=1,
            python_code=req.python_code,
            render_spec_schema=json.dumps(spec_dict) if spec_dict else None,
            checksum=checksum,
            published_at=utc_now(),
        )
        db.add(version_rec)
        db.commit()

        return self.get_style(db, req.id)

    def update_style(
        self,
        db: Session,
        style_id: str,
        req: StyleUpdateRequest,
    ) -> StyleDetail:
        style = db.query(CaptionStyle).filter(CaptionStyle.id == style_id).first()
        if not style:
            raise ValueError(f"Style '{style_id}' not found.")

        if req.name is not None:
            style.name = req.name
        if req.category is not None:
            style.category = req.category
        if req.description is not None:
            style.description = req.description
        if req.status is not None:
            style.status = req.status

        # If python code is updated, create or update a new version
        if req.python_code is not None:
            ok, _, spec_dict, err, _ = style_sandbox.execute_style(req.python_code)
            if not ok:
                raise ValueError(f"Style code failed validation: {err}")

            checksum = hashlib.sha256(req.python_code.encode("utf-8")).hexdigest()
            new_version_num = style.current_version + 1
            version_rec = CaptionStyleVersion(
                style_id=style_id,
                version=new_version_num,
                python_code=req.python_code,
                render_spec_schema=json.dumps(spec_dict) if spec_dict else None,
                checksum=checksum,
                published_at=utc_now(),
            )
            db.add(version_rec)
            style.current_version = new_version_num

        style.updated_at = utc_now()
        db.commit()
        return self.get_style(db, style_id)

    def preview_style(
        self,
        db: Session,
        req: StylePreviewRequest,
        style_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes style and produces live preview render spec and sample ASS text.
        """
        code = req.python_code
        if not code and style_id:
            style_detail = self.get_style(db, style_id)
            if style_detail:
                code = style_detail.python_code

        if not code:
            raise ValueError("No style Python code provided or style not found.")

        video = VideoContext(width=req.video_width, height=req.video_height)
        ok, meta, spec_dict, err, elapsed = style_sandbox.execute_style(code, video)
        if not ok:
            return {
                "success": False,
                "error": err,
                "execution_time_ms": round(elapsed, 2),
            }

        # Generate sample ASS output
        ass_text = ""
        try:
            renderer = ASSRenderer()
            sample_text = req.sample_text or "The quick brown fox jumps over the lazy dog"
            words_list = sample_text.split()
            sample_words = []
            cur_t = 0.0
            for i, w in enumerate(words_list):
                sample_words.append({
                    "id": f"w_{i}",
                    "word": w,
                    "start_time": cur_t,
                    "end_time": cur_t + 0.4,
                    "word_index": i,
                })
                cur_t += 0.45

            sample_segments = [
                {
                    "id": "seg_0",
                    "segment_index": 0,
                    "start_time": 0.0,
                    "end_time": cur_t,
                    "text": sample_text,
                    "words": sample_words,
                }
            ]
            spec_obj = CaptionRenderSpec.model_validate(spec_dict)
            ass_text = renderer.generate_ass(
                segments=sample_segments,
                spec=spec_obj,
                video_width=req.video_width,
                video_height=req.video_height,
            )
        except Exception as e:
            logger.warning("Could not generate sample ASS for preview: %s", e)

        return {
            "success": True,
            "render_spec": spec_dict,
            "sample_ass": ass_text,
            "execution_time_ms": round(elapsed, 2),
        }


style_service = StyleService()
