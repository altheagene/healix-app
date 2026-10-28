"""Headers added to every API response. The API only returns JSON and CSV, so it can be strict."""

from flask import request


def add_security_headers(response):
    headers = response.headers
    headers.setdefault("X-Content-Type-Options", "nosniff")
    headers.setdefault("X-Frame-Options", "DENY")
    headers.setdefault("Referrer-Policy", "no-referrer")
    headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    # Responses carry patient data, which must not linger in browser or proxy caches.
    headers.setdefault("Cache-Control", "no-store")
    if request.is_secure:
        headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response
