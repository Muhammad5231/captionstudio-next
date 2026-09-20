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
)
from sqlalchemy.orm import relationship
from apps.api.app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


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
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    assets = relationship("ProjectAsset", back_populates="project", cascade="all, delete-orphan")
    caption_tracks = relationship("CaptionTrack", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="project", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="project", cascade="all, delete-orphan")


class ProjectAsset(Base):
    __tablename__ = "project_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # VIDEO, AUDIO, SUBTITLE, THUMBNAIL
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    storage_key = Column(String(500), nullable=False)
    duration = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="assets")


class CaptionTrack(Base):
    __tablename__ = "caption_tracks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False, default="Default Track")
    language = Column(String(10), nullable=False, default="en")
    is_default = Column(Boolean, default=True)
    style_spec = Column(Text, nullable=True)  # JSON-serialized CaptionRenderSpec

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    project = relationship("Project", back_populates="caption_tracks")
    segments = relationship("CaptionSegment", back_populates="track", cascade="all, delete-orphan", order_by="CaptionSegment.segment_index")


class CaptionSegment(Base):
    __tablename__ = "caption_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    track_id = Column(String(36), ForeignKey("caption_tracks.id", ondelete="CASCADE"), nullable=False)
    segment_index = Column(Integer, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now)

    track = relationship("CaptionTrack", back_populates="segments")
    words = relationship("CaptionWord", back_populates="segment", cascade="all, delete-orphan", order_by="CaptionWord.word_index")


class CaptionWord(Base):
    __tablename__ = "caption_words"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    segment_id = Column(String(36), ForeignKey("caption_segments.id", ondelete="CASCADE"), nullable=False)
    word_index = Column(Integer, nullable=False)
    word = Column(String(255), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)

    segment = relationship("CaptionSegment", back_populates="words")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    job_type = Column(String(50), nullable=False)  # MEDIA_ANALYSIS, AUDIO_EXTRACTION, TRANSCRIPTION, SUBTITLE_IMPORT, CAPTION_GENERATION
    status = Column(String(50), nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
    stage = Column(String(100), nullable=False, default="Queued")
    progress = Column(Float, nullable=False, default=0.0)
    message = Column(String(500), nullable=False, default="")
    error_details = Column(Text, nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="jobs")


# Minimal foundation tables for Phase 2/3 compatibility
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False, default="local_user")
    username = Column(String(100), nullable=True)
    name = Column(String(100), nullable=False, default="Local User")
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="USER")  # USER, ADMIN, SUPER_ADMIN
    is_active = Column(Boolean, nullable=False, default=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", backref="user")
    exports = relationship("Export", backref="user")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True)  # Secret session token
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="sessions")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="favorites")


class CustomFont(Base):
    __tablename__ = "custom_fonts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    family_name = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Export(Base):
    __tablename__ = "exports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    format = Column(String(50), nullable=False)  # MP4, SRT, VTT, ASS, JSON
    status = Column(String(50), nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    storage_key = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    filename = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="exports")
    job = relationship("Job", backref="export")


class Template(Base):
    __tablename__ = "templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    config_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Font(Base):
    __tablename__ = "fonts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    family_name = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=True)
    target_id = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

