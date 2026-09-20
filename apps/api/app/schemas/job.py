from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class JobResponse(BaseModel):
    id: str
    project_id: str
    job_type: str
    status: str
    stage: str
    progress: float
    message: str
    error_details: Optional[str] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobProgressEvent(BaseModel):
    job_id: str
    project_id: str
    status: str
    stage: str
    progress: float
    message: str
    error: Optional[str] = None
