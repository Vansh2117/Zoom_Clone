import pytest

from app.domain.text import clean_text


def test_trims_and_collapses_whitespace():
    assert clean_text("  Team   sync \t today ", field="Title") == "Team sync today"


def test_multiline_keeps_line_breaks():
    assert clean_text(" line one\r\nline two ", field="Description", multiline=True) == (
        "line one\nline two"
    )


@pytest.mark.parametrize(
    "value",
    [
        "<script>alert(1)</script>",
        "Hello <img src=x onerror=alert(1)>",
        "</div>",
        "< script>",
        "<!-- comment -->",
        "<svg/onload=alert(1)>",
    ],
)
def test_rejects_html(value):
    with pytest.raises(ValueError, match="HTML"):
        clean_text(value, field="Title")


@pytest.mark.parametrize(
    "value", ["Budget < 5k", "I <3 Fridays", "2 > 1", "Q&A session", "Café ☕ meeting"]
)
def test_allows_plain_text_with_symbols(value):
    assert clean_text(value, field="Title") == value


@pytest.mark.parametrize("value", ["bad\x00null", "bell\x07", "esc\x1b[31m"])
def test_rejects_control_characters(value):
    with pytest.raises(ValueError, match="invalid characters"):
        clean_text(value, field="Title")
