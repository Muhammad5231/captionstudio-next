from fastapi import APIRouter
from apps.api.app.api.v1.health import router as health_router
from apps.api.app.api.v1.auth import router as auth_router
from apps.api.app.api.v1.admin import router as admin_router
from apps.api.app.api.v1.projects import router as projects_router
from apps.api.app.api.v1.uploads import router as uploads_router
from apps.api.app.api.v1.transcription import router as transcription_router
from apps.api.app.api.v1.subtitles import router as subtitles_router
from apps.api.app.api.v1.jobs import router as jobs_router
from apps.api.app.api.v1.captions import router as captions_router
from apps.api.app.api.v1.assets import router as assets_router
from apps.api.app.api.v1.templates import router as templates_router
from apps.api.app.api.v1.fonts import router as fonts_router
from apps.api.app.api.v1.exports import router as exports_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router, tags=["Health"])
api_v1_router.include_router(auth_router, tags=["Authentication"])
api_v1_router.include_router(admin_router, tags=["Admin Panel"])
api_v1_router.include_router(projects_router, tags=["Projects"])
api_v1_router.include_router(uploads_router, tags=["Uploads"])
api_v1_router.include_router(transcription_router, tags=["Transcription"])
api_v1_router.include_router(subtitles_router, tags=["Subtitles"])
api_v1_router.include_router(jobs_router, tags=["Jobs"])
api_v1_router.include_router(captions_router, tags=["Captions"])
api_v1_router.include_router(assets_router, tags=["Assets"])
api_v1_router.include_router(templates_router, tags=["Templates"])
api_v1_router.include_router(fonts_router, tags=["Fonts"])
api_v1_router.include_router(exports_router, tags=["Exports"])

