import re
from typing import Union, Tuple


class Color:
    """
    Strongly-typed Color representation supporting HEX, RGB, and RGBA.
    Provides conversions to CSS and ASS (&HAABBGGRR) format.
    """

    def __init__(self, color_str: str):
        self.raw = color_str.strip() if color_str else "transparent"
        self.r, self.g, self.b, self.a = self._parse(self.raw)

    @classmethod
    def hex(cls, hex_code: str) -> "Color":
        return cls(hex_code)

    @classmethod
    def rgb(cls, r: int, g: int, b: int) -> "Color":
        return cls(f"rgb({r},{g},{b})")

    @classmethod
    def rgba(cls, r: int, g: int, b: int, a: float) -> "Color":
        return cls(f"rgba({r},{g},{b},{a})")

    def _parse(self, s: str) -> Tuple[int, int, int, float]:
        if s.lower() == "transparent":
            return 0, 0, 0, 0.0

        # Match rgba(...) or rgb(...)
        rgba_match = re.match(
            r"rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)",
            s,
            re.IGNORECASE,
        )
        if rgba_match:
            r = max(0, min(255, int(rgba_match.group(1))))
            g = max(0, min(255, int(rgba_match.group(2))))
            b = max(0, min(255, int(rgba_match.group(3))))
            a = float(rgba_match.group(4)) if rgba_match.group(4) is not None else 1.0
            return r, g, b, max(0.0, min(1.0, a))

        # Match Hex
        clean = s.lstrip("#").strip()
        if len(clean) == 3:
            r = int(clean[0] * 2, 16)
            g = int(clean[1] * 2, 16)
            b = int(clean[2] * 2, 16)
            return r, g, b, 1.0
        elif len(clean) == 6:
            r = int(clean[0:2], 16)
            g = int(clean[2:4], 16)
            b = int(clean[4:6], 16)
            return r, g, b, 1.0
        elif len(clean) == 8:
            r = int(clean[0:2], 16)
            g = int(clean[2:4], 16)
            b = int(clean[4:6], 16)
            a = int(clean[6:8], 16) / 255.0
            return r, g, b, max(0.0, min(1.0, a))

        # Fallback to white
        return 255, 255, 255, 1.0

    def to_css(self) -> str:
        if self.a == 0.0:
            return "transparent"
        if self.a >= 1.0:
            return f"#{self.r:02X}{self.g:02X}{self.b:02X}"
        return f"rgba({self.r}, {self.g}, {self.b}, {round(self.a, 2)})"

    def to_ass(self) -> str:
        """
        Convert to ASS subtitle color format: &H[AA][BB][GG][RR]
        Note: In ASS, alpha 00 = completely opaque, FF = completely transparent.
        """
        if self.a == 0.0:
            return "&HFF000000"
        ass_alpha = int(round((1.0 - self.a) * 255))
        return f"&H{ass_alpha:02X}{self.b:02X}{self.g:02X}{self.r:02X}"

    def __str__(self) -> str:
        return self.to_css()

    def __repr__(self) -> str:
        return f"Color('{self.to_css()}')"
