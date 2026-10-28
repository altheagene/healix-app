"""Jobs the server runs for itself once a day, so no page load has to trigger them."""

from datetime import date
from threading import Lock

from models.inventory_model import expire_batches

_last_run = None
_lock = Lock()


def run_daily_tasks():
    """Cheap to call on every request: does the work only on the first request of each day."""
    global _last_run
    today = date.today()
    if _last_run == today:
        return
    with _lock:
        if _last_run == today:
            return
        expire_batches()
        _last_run = today
