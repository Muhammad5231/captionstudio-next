"""
Standalone process runner for executing Python caption style code in isolation.
Invoked via subprocess from apps.api.app.styles.sandbox.
"""

import sys
import json
import math
import random
from typing import Dict, Any

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

# Register captionstudio_style_sdk in sys.modules so `import captionstudio_style_sdk` works
import apps.api.app.styles.sdk as _sdk_pkg
sys.modules["captionstudio_style_sdk"] = _sdk_pkg


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    base_name = name.split(".")[0]
    if base_name in ("captionstudio_style_sdk", "math", "random"):
        return __import__(name, globals, locals, fromlist, level)
    raise ImportError(f"Importing '{name}' is not allowed in sandbox.")


SAFE_BUILTINS = {
    "__build_class__": __builtins__["__build_class__"] if isinstance(__builtins__, dict) else getattr(__builtins__, "__build_class__"),
    "__import__": _safe_import,
    "__name__": "<sandbox>",
    "__doc__": None,
    "abs": abs,
    "min": min,
    "max": max,
    "round": round,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "len": len,
    "range": range,
    "enumerate": enumerate,
    "zip": zip,
    "dict": dict,
    "list": list,
    "set": set,
    "tuple": tuple,
    "isinstance": isinstance,
    "issubclass": issubclass,
    "property": property,
    "classmethod": classmethod,
    "staticmethod": staticmethod,
    "super": super,
    "True": True,
    "False": False,
    "None": None,
}


def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"success": False, "error": "Empty input payload"}))
            return

        payload = json.loads(raw_input)
        code_str = payload["code"]
        video_kwargs = payload.get("video", {})
        video = VideoContext(
            width=video_kwargs.get("width", 1920),
            height=video_kwargs.get("height", 1080),
            aspect_ratio=video_kwargs.get("aspect_ratio", "16:9"),
            safe_area_margin=video_kwargs.get("safe_area_margin", 5.0),
        )

        safe_globals = {
            "__builtins__": SAFE_BUILTINS,
            "math": math,
            "random": random,
            "Color": Color,
            "Typography": Typography,
            "Animation": Animation,
            "Position": Position,
            "VideoContext": VideoContext,
            "WordContext": WordContext,
            "SegmentContext": SegmentContext,
            "RenderSpec": RenderSpec,
            "CaptionStyle": CaptionStyle,
        }
        local_scope: Dict[str, Any] = {}

        compiled = compile(code_str, "<style_sandbox>", "exec")
        exec(compiled, safe_globals, local_scope)

        # Locate CaptionStyle class or instance
        target_style = None
        if "style" in local_scope and isinstance(local_scope["style"], CaptionStyle):
            target_style = local_scope["style"]
        elif "export_style" in local_scope and isinstance(local_scope["export_style"], CaptionStyle):
            target_style = local_scope["export_style"]
        else:
            for val in local_scope.values():
                if isinstance(val, type) and issubclass(val, CaptionStyle) and val is not CaptionStyle:
                    target_style = val()
                    break
                elif isinstance(val, CaptionStyle):
                    target_style = val
                    break

        if target_style is None:
            print(json.dumps({
                "success": False,
                "error": "Style code must define a class inheriting from 'CaptionStyle' or assign an instance to 'style'."
            }))
            return

        spec_result = target_style.build_render_spec(video)
        if isinstance(spec_result, RenderSpec):
            spec_dict = spec_result.to_dict()
        elif isinstance(spec_result, dict):
            spec_dict = spec_result
        else:
            print(json.dumps({"success": False, "error": "build_render_spec must return a RenderSpec or dict."}))
            return

        # Validate with pydantic schema
        validated = CaptionRenderSpec.model_validate(spec_dict)

        print(json.dumps({
            "success": True,
            "style_id": getattr(target_style, "id", "custom-style"),
            "style_name": getattr(target_style, "name", "Custom Style"),
            "category": getattr(target_style, "category", "VIRAL_BOLD"),
            "description": getattr(target_style, "description", ""),
            "render_spec": validated.model_dump(),
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))


if __name__ == "__main__":
    main()
