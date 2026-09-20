from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CaptionWordBase(BaseModel):
    word: str
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., ge=0.0)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class CaptionWordCreate(CaptionWordBase):
    word_index: int


class CaptionWordResponse(CaptionWordBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    word_index: int


class CaptionSegmentBase(BaseModel):
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., ge=0.0)
    text: str


class CaptionSegmentCreate(CaptionSegmentBase):
    segment_index: int
    words: List[CaptionWordCreate] = []


class CaptionSegmentResponse(CaptionSegmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    segment_index: int
    words: List[CaptionWordResponse] = []


class CaptionTrackBase(BaseModel):
    name: str = "Default Track"
    language: str = "en"
    is_default: bool = True


class CaptionTrackCreate(CaptionTrackBase):
    project_id: str
    segments: List[CaptionSegmentCreate] = []


class CaptionTrackUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    segments: Optional[List[CaptionSegmentCreate]] = None


class CaptionTrackResponse(CaptionTrackBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    segments: List[CaptionSegmentResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
