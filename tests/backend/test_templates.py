import pytest
from apps.api.app.services.templates.template_service import template_service
from apps.api.app.schemas.render_spec import StyleCategory


def test_all_60_templates_loaded():
    templates = template_service.list_templates()
    assert len(templates) >= 60, f"Expected at least 60 templates, found {len(templates)}"

    # Check that each ID is unique
    ids = [t.id for t in templates]
    assert len(ids) == len(set(ids)), "Duplicate template IDs detected"


def test_category_distribution():
    for cat in StyleCategory:
        cat_templates = template_service.list_templates(category=cat)
        assert len(cat_templates) == 10, f"Category {cat.value} expected 10 templates, found {len(cat_templates)}"


def test_template_search():
    results = template_service.list_templates(search="Hormozi")
    assert len(results) >= 1
    assert any("hormozi" in t.id for t in results)

    results_none = template_service.list_templates(search="non_existent_style_xyz")
    assert len(results_none) == 0


def test_get_template_by_id():
    hormozi = template_service.get_template("viral-hormozi")
    assert hormozi is not None
    assert hormozi.name == "Hormozi Punch"
    assert hormozi.category == StyleCategory.VIRAL_BOLD
    assert hormozi.renderSpec.highlightColor == "#FFE600"

