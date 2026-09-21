from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from apps.api.app.styles.sdk.context import VideoContext, WordContext
from apps.api.app.styles.sdk.render_spec import RenderSpec


class CaptionStyle(ABC):
    """
    Abstract base class for all CaptionStudio Python styles.
    """

    id: str
    name: str
    category: str = "VIRAL_BOLD"
    description: str = ""

    @abstractmethod
    def build_render_spec(self, video: VideoContext) -> RenderSpec:
        """
        Constructs the RenderSpec dynamically adapted to the video context (dimensions, aspect ratio).
        """
        raise NotImplementedError

    def build_word_style(self, word: WordContext, video: VideoContext) -> Optional[Dict[str, Any]]:
        """
        Optional hook for style classes that provide custom word-level styling.
        """
        return None
