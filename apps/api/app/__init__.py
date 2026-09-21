import sys
from pathlib import Path

# Ensure repository root is on sys.path so 'apps.api.app.*' imports work from any cwd
_repo_root = str(Path(__file__).resolve().parents[3])
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)
