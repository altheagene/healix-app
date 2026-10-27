"""Signed login tokens. The browser sends the token back on later requests."""

import os

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

SECRET = os.environ.get("HEALIX_SECRET")
if not SECRET:
    raise RuntimeError("Set the HEALIX_SECRET environment variable before starting the server.")
TOKEN_MAX_AGE = 60 * 60 * 8
_serializer = URLSafeTimedSerializer(SECRET, salt="healix-login")


def create_token(staff_id, token_version):
    # The role is not stored here. Each request reads it from the staff row, so a
    # role change applies at once, and a changed token_version ends the session.
    return _serializer.dumps({"staff_id": staff_id, "v": token_version})


def read_token(token):
    return _serializer.loads(token, max_age=TOKEN_MAX_AGE)


__all__ = ["BadSignature", "SignatureExpired", "create_token", "read_token"]
