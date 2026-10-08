from itertools import cycle

import pytest

from app.domain.meeting_code import (
    GENERATED_CODE_LENGTH,
    generate_meeting_code,
    is_valid_meeting_code,
)


def test_generated_code_is_ten_digits():
    for _ in range(200):
        code = generate_meeting_code()
        assert len(code) == GENERATED_CODE_LENGTH
        assert code.isdigit()
        assert code[0] != "0"


def test_generated_code_is_deterministic_with_injected_rng():
    digits = cycle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    code = generate_meeting_code(randbelow=lambda _upper: next(digits))
    # first digit is randbelow(9) + 1 -> 0 + 1
    assert code == "1123456789"


def test_generated_codes_are_varied():
    assert len({generate_meeting_code() for _ in range(500)}) > 495


@pytest.mark.parametrize("value", ["123456789", "1234567890", "12345678901"])
def test_valid_codes(value):
    assert is_valid_meeting_code(value)


@pytest.mark.parametrize(
    "value", ["", "12345678", "123456789012", "12345abcde", "123 456 7890", " 1234567890"]
)
def test_invalid_codes(value):
    assert not is_valid_meeting_code(value)
