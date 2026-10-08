"""User-supplied text validation (titles, descriptions, display names).

Strategy for XSS: *validate on input, escape on output*.

* Input: we reject anything that looks like an HTML tag (`<script`, `<img`,
  `</div`...) and ASCII control characters. Plain comparisons such as
  "budget < 5k" are still allowed - we do not blindly strip characters,
  because silently mangling user data is surprising and hard to reason about.
* Output: React escapes all interpolated strings, so even data that bypassed
  the API would render as text, never as markup.
"""

import re

_HTML_TAG_PATTERN = re.compile(r"<\s*/?\s*[a-zA-Z!?]")
# All C0 control chars except tab (\x09), newline (\x0a) and carriage return (\x0d), plus DEL.
_CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_text(value: str, *, field: str, multiline: bool = False) -> str:
    """Trim and validate a user-facing string, raising `ValueError` when invalid.

    Single-line values also have runs of whitespace collapsed to one space.
    """
    value = value.strip()

    if _CONTROL_CHAR_PATTERN.search(value):
        raise ValueError(f"{field} contains invalid characters")
    if _HTML_TAG_PATTERN.search(value):
        raise ValueError(f"{field} must not contain HTML tags")

    if multiline:
        return value.replace("\r\n", "\n")
    return " ".join(value.split())
