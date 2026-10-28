from datetime import date, timedelta

import maintenance

PAST = (date.today() - timedelta(days=1)).isoformat()
FUTURE = (date.today() + timedelta(days=30)).isoformat()


def test_refreshbatches_route_is_gone(client, headers):
    assert client.get("/refreshbatches", headers=headers("staff")).status_code in (403, 404)


def test_expired_batches_turn_inactive_on_first_request_of_the_day(client, headers, db):
    db.execute("UPDATE batches SET expiration_date = ? WHERE batch_id = 1", (PAST,))
    db.commit()
    maintenance._last_run = None
    client.get("/getallservices", headers=headers("staff"))
    assert db.execute("SELECT is_active FROM batches WHERE batch_id = 1").fetchone()[0] == 0


def test_daily_tasks_run_once_per_day(client, headers, db):
    h = headers("staff")
    client.get("/getallservices", headers=h)  # first request of the "day"
    db.execute("UPDATE batches SET expiration_date = ? WHERE batch_id = 1", (PAST,))
    db.commit()
    client.get("/getallservices", headers=h)  # same day: not run again
    assert db.execute("SELECT is_active FROM batches WHERE batch_id = 1").fetchone()[0] == 1


def test_editing_a_batch_to_a_past_date_expires_it_at_once(client, headers, db):
    h = headers("staff")
    client.get("/getallservices", headers=h)
    body = {"batch_id": 1, "expiration_date": PAST}
    assert client.post("/editbatch", headers=h, json=body).json == {"success": True}
    assert db.execute("SELECT is_active FROM batches WHERE batch_id = 1").fetchone()[0] == 0


def test_batches_without_expiry_or_in_date_stay_active(client, headers, db):
    db.execute("UPDATE batches SET expiration_date = ? WHERE batch_id = 1", (FUTURE,))
    db.commit()
    maintenance._last_run = None
    client.get("/getallservices", headers=headers("staff"))
    assert db.execute("SELECT is_active FROM batches WHERE batch_id = 1").fetchone()[0] == 1


def test_database_runs_in_wal_mode(db):
    assert db.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
