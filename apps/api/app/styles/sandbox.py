import ast
import time
import subprocess
import json
import os
import sys
from typing import Dict, Any, Tuple, Optional
from pathlib import Path

_REPO_ROOT = str(Path(__file__).resolve().parents[4])

from apps.api.app.styles.sdk import (
    Color,
    Typography,
    Animation,
    Position,
    VideoContext,
    WordContext,
    SegmentContext,
    RenderSpec,
    CaptionStyle,
)
from apps.api.app.schemas.render_spec import CaptionRenderSpec

# Register captionstudio_style_sdk in sys.modules
import apps.api.app.styles.sdk as _sdk_pkg
sys.modules["captionstudio_style_sdk"] = _sdk_pkg

# Disallowed modules for AST static analysis
DISALLOWED_MODULES = {
    "os",
    "sys",
    "subprocess",
    "shutil",
    "socket",
    "requests",
    "httpx",
    "urllib",
    "http",
    "pathlib",
    "importlib",
    "ctypes",
    "threading",
    "multiprocessing",
    "inspect",
    "builtins",
    "pickle",
    "marshal",
    "shelve",
    "pty",
    "code",
    "platform",
}

# Disallowed builtins and functions
DISALLOWED_NAMES = {
    "eval",
    "exec",
    "open",
    "compile",
    "__import__",
    "globals",
    "locals",
    "getattr",
    "setattr",
    "delattr",
    "hasattr",
    "breakpoint",
    "input",
    "help",
    "exit",
    "quit",
}

# Disallowed attribute access to prevent MRO / dunder sandbox escapes
DISALLOWED_ATTRS = {
    "__class__",
    "__subclasses__",
    "__mro__",
    "__bases__",
    "__base__",
    "__dict__",
    "__globals__",
    "__code__",
    "__closure__",
    "__func__",
}


class SandboxSecurityError(Exception):
    """Raised when Python style code violates security constraints."""
    pass


class StyleASTValidator(ast.NodeVisitor):
    """
    Statically analyzes the AST of style code to prevent dangerous operations
    before execution begins.
    """

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_mod = alias.name.split(".")[0]
            if base_mod in DISALLOWED_MODULES:
                raise SandboxSecurityError(f"Importing module '{alias.name}' is strictly forbidden.")
            if base_mod not in ("math", "random", "captionstudio_style_sdk", "apps"):
                raise SandboxSecurityError(f"Module '{alias.name}' is not in the allowed sandbox imports.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_mod = node.module.split(".")[0]
            if base_mod in DISALLOWED_MODULES:
                raise SandboxSecurityError(f"Importing from '{node.module}' is strictly forbidden.")
            if base_mod not in ("math", "random", "captionstudio_style_sdk", "apps"):
                raise SandboxSecurityError(f"Module '{node.module}' is not in the allowed sandbox imports.")
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name):
        if node.id in DISALLOWED_NAMES:
            raise SandboxSecurityError(f"Use of '{node.id}' is forbidden in style code.")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in DISALLOWED_ATTRS:
            raise SandboxSecurityError(f"Accessing attribute '{node.attr}' is forbidden.")
        self.generic_visit(node)


def validate_style_ast(code_str: str) -> None:
    """Parses and validates the AST of the python code."""
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        raise SandboxSecurityError(f"Python Syntax Error (line {e.lineno}): {e.msg}")

    validator = StyleASTValidator()
    validator.visit(tree)


class StyleSandbox:
    """
    Sandboxed runner for user and built-in Python caption styles.
    Enforces static AST verification, separate OS process isolation, timeouts, and schema checks.
    NEVER executes arbitrary Python in the FastAPI main process.
    """

    def __init__(self, timeout_seconds: float = 3.0):
        self.timeout_seconds = timeout_seconds

    def execute_style(
        self,
        code_str: str,
        video_context: Optional[VideoContext] = None,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str], float]:
        """
        Executes style python code safely in an isolated child process.
        Returns (is_valid, style_meta, render_spec_dict, error_message, execution_time_ms).
        """
        start_time = time.perf_counter()
        video = video_context or VideoContext()

        # Step 1: Static AST validation
        try:
            validate_style_ast(code_str)
        except SandboxSecurityError as e:
            elapsed = (time.perf_counter() - start_time) * 1000
            return False, None, None, str(e), elapsed
        except Exception as e:
            elapsed = (time.perf_counter() - start_time) * 1000
            return False, None, None, f"Security check error: {e}", elapsed

        # Step 2: Prepare payload
        payload = {
            "code": code_str,
            "video": {
                "width": video.width,
                "height": video.height,
                "aspect_ratio": video.aspect_ratio,
                "safe_area_margin": video.safe_area_margin,
            },
        }
        input_bytes = json.dumps(payload).encode("utf-8")

        # Step 3: Run isolated runner via subprocess
        env = dict(os.environ)
        if _REPO_ROOT not in env.get("PYTHONPATH", ""):
            env["PYTHONPATH"] = _REPO_ROOT + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

        try:
            proc = subprocess.Popen(
                [sys.executable, "-m", "apps.api.app.styles.sandbox_runner"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=_REPO_ROOT,
                env=env,
            )
            stdout_bytes, stderr_bytes = proc.communicate(input=input_bytes, timeout=self.timeout_seconds)
            elapsed = (time.perf_counter() - start_time) * 1000

            if proc.returncode != 0:
                err_msg = stderr_bytes.decode("utf-8", errors="ignore").strip() or f"Process exited with code {proc.returncode}"
                return False, None, None, err_msg, elapsed

            result_json = json.loads(stdout_bytes.decode("utf-8", errors="ignore").strip())
            if not result_json.get("success"):
                return False, None, None, result_json.get("error", "Execution failed"), elapsed

            style_meta = {
                "id": result_json.get("style_id"),
                "name": result_json.get("style_name"),
                "category": result_json.get("category"),
                "description": result_json.get("description"),
            }
            return True, style_meta, result_json.get("render_spec"), None, elapsed

        except subprocess.TimeoutExpired:
            try:
                proc.kill()
                proc.communicate()
            except Exception:
                pass
            elapsed = (time.perf_counter() - start_time) * 1000
            return False, None, None, f"Execution timed out (> {self.timeout_seconds}s limit).", elapsed
        except Exception as e:
            elapsed = (time.perf_counter() - start_time) * 1000
            return False, None, None, str(e), elapsed


style_sandbox = StyleSandbox()
