"""Meeting ID generation and validation.

Zoom meeting IDs are 9-11 digit numbers. We *generate* 10-digit codes (first
digit never 0, so the code never loses a digit if someone treats it as a
number) and *accept* 9-11 digits as input so the format check matches Zoom's.
"""

import re
import secrets
from collections.abc import Callable

GENERATED_CODE_LENGTH = 10
MEETING_CODE_REGEX = r"^\d{9,11}$"

_MEETING_CODE_PATTERN = re.compile(MEETING_CODE_REGEX)


def generate_meeting_code(randbelow: Callable[[int], int] = secrets.randbelow) -> str:
    """Return a random 10-digit meeting code.

    `secrets` (not `random`) is used so codes are not predictable: anyone who
    knows the code can join, so it behaves like a weak shared secret.
    `randbelow` is injectable to make the function deterministic in tests.
    """
    first_digit = randbelow(9) + 1  # 1-9
    remaining = "".join(str(randbelow(10)) for _ in range(GENERATED_CODE_LENGTH - 1))
    return f"{first_digit}{remaining}"


def is_valid_meeting_code(value: str) -> bool:
    return bool(_MEETING_CODE_PATTERN.fullmatch(value))
