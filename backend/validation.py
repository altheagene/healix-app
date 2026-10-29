"""Checks on request data. A failed check becomes a 400 response naming the problem."""

from datetime import date


class ValidationError(Exception):
    pass


def require(data, *fields):
    missing = [field for field in fields if data.get(field) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required field{'s' if len(missing) > 1 else ''}: {', '.join(missing)}")


def non_negative_int(value, name):
    """Accepts 3, 3.0 or "3". Refuses negatives, fractions, text and true/false."""
    if isinstance(value, bool):
        number = None
    elif isinstance(value, int):
        number = value
    elif isinstance(value, float) and value.is_integer():
        number = int(value)
    elif isinstance(value, str) and value.strip().isdigit():
        number = int(value)
    else:
        number = None
    if number is None or number < 0:
        raise ValidationError(f"{name} must be a whole number of 0 or more")
    return number


def iso_date(value, name):
    try:
        return date.fromisoformat(str(value)).isoformat()
    except (TypeError, ValueError):
        raise ValidationError(f"{name} must be a date like 2026-01-31") from None


def medications(items):
    """Validate a list of {supply_id, quantity} and return it cleaned."""
    if items is None:
        return []
    if not isinstance(items, list):
        raise ValidationError("medications must be a list")
    cleaned = []
    for item in items:
        if not isinstance(item, dict) or item.get("supply_id") in (None, ""):
            continue  # the form sends empty rows for unused medicine slots
        cleaned.append({
            "supply_id": non_negative_int(item["supply_id"], "supply_id"),
            "quantity": non_negative_int(item.get("quantity") or 0, "quantity"),
        })
    return cleaned
