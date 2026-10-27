"""Slows down password guessing. Counts failed logins in memory, so it resets on restart."""

import time
from threading import Lock

WINDOW_SECONDS = 15 * 60
MAX_FAILS_PER_ACCOUNT = 5   # one username from one address
MAX_FAILS_PER_ADDRESS = 20  # any usernames from one address

_failures = {}
_lock = Lock()


def _keys(username, ip):
    return (
        (("account", (username or "").strip().lower(), ip), MAX_FAILS_PER_ACCOUNT),
        (("address", ip), MAX_FAILS_PER_ADDRESS),
    )


def _recent(key, now):
    times = [t for t in _failures.get(key, []) if now - t < WINDOW_SECONDS]
    if times:
        _failures[key] = times
    else:
        _failures.pop(key, None)
    return times


def retry_after(username, ip):
    """Seconds until this login may be tried again, or 0 if it is allowed now."""
    now = time.time()
    wait = 0
    with _lock:
        for key, limit in _keys(username, ip):
            times = _recent(key, now)
            if len(times) >= limit:
                wait = max(wait, int(times[0] + WINDOW_SECONDS - now) + 1)
    return wait


def record_failure(username, ip):
    now = time.time()
    with _lock:
        for key, _ in _keys(username, ip):
            _failures.setdefault(key, []).append(now)


def clear_account(username, ip):
    with _lock:
        _failures.pop(_keys(username, ip)[0][0], None)
