"""Pure business rules.

Nothing in this package imports FastAPI, SQLAlchemy or LiveKit. Keeping the
rules framework-free makes them trivial to unit test and easy to explain:
"what is a valid meeting code?", "which status changes are legal?",
"is this meeting upcoming or recent?" are all answered here.
"""
