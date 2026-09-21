import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.database.session import init_db
from apps.api.app.styles.sdk import (
    Color,
    Typography,
    Animation,
    Position,
    VideoContext,
    RenderSpec,
    CaptionStyle,
)
from apps.api.app.styles.sandbox import style_sandbox


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin_token(client):
    res = client.post("/api/v1/admin/auth/login", json={"password": "admin123"})
    assert res.status_code == 200
    return res.json()["token"]


def test_style_sdk_color_and_ass_conversion():
    c_hex = Color.hex("#FFE600")
    assert c_hex.to_css() == "#FFE600"
    # ASS format: &HAABBGGRR (opacity 00, Blue=00, Green=E6, Red=FF)
    assert c_hex.to_ass() == "&H0000E6FF"

    c_rgba = Color.rgba(0, 0, 0, 0.5)
    assert c_rgba.r == 0 and c_rgba.g == 0 and c_rgba.b == 0
    # ASS alpha for 0.5 opacity is ~128 (0x80)
    assert c_rgba.to_ass().startswith("&H80")


def test_style_sdk_renderspec_build():
    spec = RenderSpec(
        typography=Typography(font_family="Montserrat", font_size=48, font_weight="800"),
        text_color=Color.hex("#FFFFFF"),
        highlight_color=Color.hex("#FFE600"),
        position=Position(x=50.0, y=80.0),
        animation=Animation(animation_type="word-pop", duration_ms=120),
    )
    d = spec.to_dict()
    assert d["fontFamily"] == "Montserrat"
    assert d["fontSize"] == 48
    assert d["textColor"] == "#FFFFFF"
    assert d["highlightColor"] == "#FFE600"
    assert d["animation"]["type"] == "word-pop"


def test_sandbox_security_rejections():
    # Blocks forbidden os import
    ok, _, _, err, _ = style_sandbox.execute_style("import os")
    assert not ok
    assert "Importing module 'os' is strictly forbidden" in err

    # Blocks file open
    ok, _, _, err, _ = style_sandbox.execute_style("f = open('secret.txt')")
    assert not ok
    assert "Use of 'open' is forbidden" in err

    # Blocks eval
    ok, _, _, err, _ = style_sandbox.execute_style("eval('1+1')")
    assert not ok
    assert "Use of 'eval' is forbidden" in err

    # Times out on infinite loop
    ok, _, _, err, _ = style_sandbox.execute_style("while True: pass")
    assert not ok
    assert "timed out" in err.lower()


def test_all_15_builtin_styles_execute_and_validate():
    root = Path("styles/builtin")
    dirs = sorted([d for d in root.iterdir() if d.is_dir()])
    assert len(dirs) == 15, f"Expected exactly 15 built-in styles, found {len(dirs)}"

    for d in dirs:
        style_file = d / "style.py"
        assert style_file.exists()
        code = style_file.read_text(encoding="utf-8")
        ok, meta, spec, err, elapsed = style_sandbox.execute_style(code)
        assert ok is True, f"Style in {d.name} failed: {err}"
        assert spec is not None
        assert "fontFamily" in spec
        assert "textColor" in spec
        assert "highlightColor" in spec


def test_public_styles_api(client):
    res = client.get("/api/v1/styles")
    assert res.status_code == 200
    styles = res.json()
    assert len(styles) >= 15
    style_ids = [s["id"] for s in styles]
    assert "clean-editorial" in style_ids
    assert "bold-impact" in style_ids
    assert "viral-motion" in style_ids

    # Detail endpoint
    res_detail = client.get("/api/v1/styles/clean-editorial")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["name"] == "Clean Editorial"
    assert "python_code" in detail
    assert detail["render_spec"] is not None

    # Preview endpoint
    res_prev = client.post(
        "/api/v1/styles/clean-editorial/preview",
        json={"sample_text": "Testing live ASS preview generation"},
    )
    assert res_prev.status_code == 200
    prev_data = res_prev.json()
    assert prev_data["success"] is True
    assert "[Script Info]" in prev_data["sample_ass"]


def test_admin_style_creation_validation_lifecycle(client, admin_token):
    import uuid
    test_id = f"custom-synth-{uuid.uuid4().hex[:6]}"
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Validate custom style code
    custom_code = f'''
from captionstudio_style_sdk import CaptionStyle, RenderSpec, Typography, Color, Animation

class MyCustomStyle(CaptionStyle):
    id = "{test_id}"
    name = "Custom Synth"
    category = "VIRAL_BOLD"
    def build_render_spec(self, video):
        return RenderSpec(
            typography=Typography(font_family="Impact", font_size=52),
            text_color=Color.hex("#00FFFF"),
            highlight_color=Color.hex("#FF00FF"),
            animation=Animation(animation_type="word-pop", duration_ms=100)
        )

style = MyCustomStyle()
'''
    res_val = client.post(
        "/api/v1/admin/styles/validate",
        json={"python_code": custom_code},
        headers=headers,
    )
    assert res_val.status_code == 200
    assert res_val.json()["is_valid"] is True

    # 2. Create new style
    res_create = client.post(
        "/api/v1/admin/styles",
        json={
            "id": test_id,
            "name": "Custom Synth",
            "category": "VIRAL_BOLD",
            "description": "Test custom style",
            "python_code": custom_code,
        },
        headers=headers,
    )
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["id"] == test_id
    assert created["current_version"] == 1

    # 3. Update style
    updated_code = custom_code.replace("font_size=52", "font_size=58")
    res_update = client.put(
        f"/api/v1/admin/styles/{test_id}",
        json={"python_code": updated_code},
        headers=headers,
    )
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["current_version"] == 2
