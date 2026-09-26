"""Signed login tokens. The browser sends the token back on later requests."""

import os

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

SECRET = os.environ.get("HEALIX_SECRET", "healix-dev-secret")
TOKEN_MAX_AGE = 60 * 60 * 8
_serializer = URLSafeTimedSerializer(SECRET, salt="healix-login")


def create_token(staff_id, staff_category_id, category_name):
    return _serializer.dumps(
        {
            "staff_id": staff_id,
            "staff_category_id": staff_category_id,
            "category_name": category_name,
        }
    )


def read_token(token):
    return _serializer.loads(token, max_age=TOKEN_MAX_AGE)


__all__ = ["BadSignature", "SignatureExpired", "create_token", "read_token"]
