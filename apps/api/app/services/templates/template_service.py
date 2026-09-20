import json
from pathlib import Path
from typing import Dict, List, Optional
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger
from apps.api.app.schemas.render_spec import StyleTemplate, StyleCategory


class TemplateService:
    """
    Template service that loads, validates, caches, and serves 60+ data-driven caption style templates.
    """

    def __init__(self, templates_dir: Optional[Path] = None):
        self._dir = (templates_dir or settings.data_dir / "templates").resolve()
        self._dir.mkdir(parents=True, exist_ok=True)
        self._templates_cache: Dict[str, StyleTemplate] = {}
        self.load_templates()

    @property
    def templates_dir(self) -> Path:
        return self._dir

    def load_templates(self) -> Dict[str, StyleTemplate]:
        """Loads all JSON template files from the templates directory."""
        self._templates_cache.clear()

        for file_path in self._dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    template = StyleTemplate(**data)
                    self._templates_cache[template.id] = template
            except Exception as e:
                logger.error("Failed to load template %s: %s", file_path.name, e)

        logger.info("TemplateService loaded %d templates from %s", len(self._templates_cache), self._dir)
        return self._templates_cache

    def list_templates(
        self,
        category: Optional[StyleCategory] = None,
        search: Optional[str] = None,
    ) -> List[StyleTemplate]:
        """Filters templates by category and search keyword."""
        results = list(self._templates_cache.values())

        if category:
            results = [t for t in results if t.category == category]

        if search:
            query = search.strip().lower()
            results = [
                t for t in results
                if query in t.name.lower()
                or query in t.description.lower()
                or any(query in tag.lower() for tag in t.tags)
            ]

        return results

    def get_template(self, template_id: str) -> Optional[StyleTemplate]:
        """Fetches a specific template by ID."""
        return self._templates_cache.get(template_id)


template_service = TemplateService()

