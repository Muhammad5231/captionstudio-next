import uvicorn
import os
import sys
from pathlib import Path

# Add project root to sys.path so apps.api imports resolve cleanly
root = Path(__file__).resolve().parent.parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from apps.api.app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "apps.api.app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG,
    )

