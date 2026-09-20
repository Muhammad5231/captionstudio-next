import json
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from apps.api.app.schemas.render_spec import CaptionRenderSpec


class CaptionWordBase(BaseModel):
    word: str
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., ge=0.0)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class CaptionWordCreate(CaptionWordBase):
    word_index: Optional[int] = 0


class CaptionWordResponse(CaptionWordBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    word_index: int


class CaptionSegmentBase(BaseModel):
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., ge=0.0)
    text: str


class CaptionSegmentCreate(CaptionSegmentBase):
    segment_index: Optional[int] = 0
    words: Optional[List[CaptionWordCreate]] = []


class CaptionSegmentResponse(CaptionSegmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    segment_index: int
    words: List[CaptionWordResponse] = []


class CaptionTrackBase(BaseModel):
    name: str = "Default Track"
    language: str = "en"
    is_default: bool = True
    style: Optional[CaptionRenderSpec] = None


class CaptionTrackCreate(CaptionTrackBase):
    project_id: str
    segments: List[CaptionSegmentCreate] = []


class CaptionTrackUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    segments: Optional[List[CaptionSegmentCreate]] = None
    style: Optional[CaptionRenderSpec] = None


class CaptionTrackResponse(CaptionTrackBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    segments: List[CaptionSegmentResponse] = []
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

    @model_validator(mode="before")
    @classmethod
    def extract_style_from_orm(cls, data: Any) -> Any:
        if hasattr(data, "style_spec"):
            style_raw = getattr(data, "style_spec")
            if style_raw and isinstance(style_raw, str):
                try:
                    parsed = json.loads(style_raw)
                    # Dynamically set style attribute if data is an object
                    setattr(data, "style", parsed)
                except Exception:
                    pass
            elif not hasattr(data, "style") or getattr(data, "style") is None:
                setattr(data, "style", CaptionRenderSpec().model_dump())
        elif isinstance(data, dict):
            if "style_spec" in data and not data.get("style"):
                spec = data.get("style_spec")
                if isinstance(spec, str) and spec:
                    try:
                        data["style"] = json.loads(spec)
                    except Exception:
                        data["style"] = CaptionRenderSpec().model_dump()
            elif not data.get("style"):
                data["style"] = CaptionRenderSpec().model_dump()
        return data
