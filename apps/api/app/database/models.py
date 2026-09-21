import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from apps.api.app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AdminSession(Base):
    __tablename__ = "admin_sessions"

    id = Column(String(64), primary_key=True)  # Cryptographically secure random token
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="CREATED")  # CREATED, PROCESSING, READY, FAILED
    source_type = Column(String(50), nullable=False)  # VIDEO, SUBTITLE, VIDEO_WITH_SUBTITLE
    duration = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    language = Column(String(10), nullable=True, default="en")
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    assets = relationship("ProjectAsset", back_populates="project", cascade="all, delete-orphan")
    caption_tracks = relationship("CaptionTrack", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="project", cascade="all, delete-orphan")


class ProjectAsset(Base):
    __tablename__ = "project_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # VIDEO, AUDIO, SUBTITLE, THUMBNAIL
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    storage_key = Column(String(500), nullable=False)
    duration = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    project = relationship("Project", back_populates="assets")


class CaptionTrack(Base):
    __tablename__ = "caption_tracks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False, default="Default Track")
    language = Column(String(10), nullable=False, default="en")
    is_default = Column(Boolean, default=True, nullable=False)
    style_spec = Column(Text, nullable=True)  # JSON-serialized CaptionRenderSpec

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="caption_tracks")
    segments = relationship(
        "CaptionSegment",
        back_populates="track",
        cascade="all, delete-orphan",
        order_by="CaptionSegment.segment_index",
    )


class CaptionSegment(Base):
    __tablename__ = "caption_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    track_id = Column(String(36), ForeignKey("caption_tracks.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_index = Column(Integer, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    track = relationship("CaptionTrack", back_populates="segments")
    words = relationship(
        "CaptionWord",
        back_populates="segment",
        cascade="all, delete-orphan",
        order_by="CaptionWord.word_index",
    )


class CaptionWord(Base):
    __tablename__ = "caption_words"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    segment_id = Column(String(36), ForeignKey("caption_segments.id", ondelete="CASCADE"), nullable=False, index=True)
    word_index = Column(Integer, nullable=False)
    word = Column(String(255), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)

    segment = relationship("CaptionSegment", back_populates="words")


class CaptionStyle(Base):
    __tablename__ = "caption_styles"

    id = Column(String(64), primary_key=True)  # e.g. "clean-editorial", "bold-impact"
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, default="VIRAL_BOLD")
    description = Column(Text, nullable=False, default="")
    status = Column(String(30), nullable=False, default="PUBLISHED")  # DRAFT, PUBLISHED, ARCHIVED
    is_builtin = Column(Boolean, nullable=False, default=False)
    current_version = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    versions = relationship(
        "CaptionStyleVersion",
        back_populates="style",
        cascade="all, delete-orphan",
        order_by="desc(CaptionStyleVersion.version)",
    )


class CaptionStyleVersion(Base):
    __tablename__ = "caption_style_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    style_id = Column(String(64), ForeignKey("caption_styles.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    python_code = Column(Text, nullable=False)
    render_spec_schema = Column(Text, nullable=True)  # Serialized preview/default spec JSON
    checksum = Column(String(64), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    style = relationship("CaptionStyle", back_populates="versions")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    job_type = Column(String(50), nullable=False)  # MEDIA_ANALYSIS, AUDIO_EXTRACTION, TRANSCRIPTION, SUBTITLE_IMPORT, CAPTION_GENERATION, RENDER_EXPORT
    status = Column(String(50), nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
    stage = Column(String(100), nullable=False, default="Queued")
    progress = Column(Float, nullable=False, default=0.0)
    message = Column(String(500), nullable=False, default="")
    error_details = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="jobs")


class Export(Base):
    __tablename__ = "exports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    format = Column(String(50), nullable=False)  # MP4, SRT, VTT, ASS, JSON
    status = Column(String(50), nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    storage_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    filename = Column(String(255), nullable=True)

    # Rich metadata
    source_filename = Column(String(255), nullable=True)
    source_duration = Column(Float, nullable=True)
    source_width = Column(Integer, nullable=True)
    source_height = Column(Integer, nullable=True)
    source_fps = Column(Float, nullable=True)
    output_filename = Column(String(255), nullable=True)
    output_duration = Column(Float, nullable=True)
    output_width = Column(Integer, nullable=True)
    output_height = Column(Integer, nullable=True)
    output_fps = Column(Float, nullable=True)
    output_size = Column(Integer, nullable=True)
    style_id = Column(String(64), nullable=True)
    style_name = Column(String(100), nullable=True)
    style_version = Column(Integer, nullable=True)
    caption_language = Column(String(20), nullable=True)
    encoder = Column(String(50), nullable=True)
    quality_preset = Column(String(50), nullable=True)
    error = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="exports")
    job = relationship("Job", backref="export")


class Font(Base):
    __tablename__ = "fonts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    family_name = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False, default="")
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor = Column(String(100), nullable=False, default="admin")
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=True)
    target_id = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
