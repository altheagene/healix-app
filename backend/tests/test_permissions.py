import pytest

import roles


def test_every_route_has_a_role_rule(app):
    from app import OPEN_PATHS

    assert roles.unlisted_routes(app.url_map, OPEN_PATHS) == []


def test_unlisted_route_is_refused_even_for_admin(client, headers):
    assert roles.permission_error(roles.ADMIN, "GET", "/some-new-route") is not None
    assert client.get("/some-new-route", headers=headers("admin")).status_code == 403


@pytest.mark.parametrize("path", ["/addvisitlog", "/addmedicationdetails", "/updatevisitlog", "/updatemedicationdetails"])
def test_staff_role_cannot_save_clinical_records(client, headers, path):
    assert client.post(path, headers=headers("staff"), json={}).status_code == 403


def test_nurse_can_save_clinical_records(client, headers):
    assert client.post("/addvisitlog", headers=headers("nurse"), json={}).status_code != 403


@pytest.mark.parametrize("username", ["staff", "nurse", "doctor"])
def test_only_admin_can_add_staff(client, headers, username):
    assert client.post("/addstaff", headers=headers(username), json={}).status_code == 403


def test_cors_allows_only_configured_origins(client, headers):
    h = headers("staff")
    evil = client.get("/getallservices", headers={**h, "Origin": "https://evil.example"})
    local = client.get("/getallservices", headers={**h, "Origin": "http://localhost:5173"})
    assert "Access-Control-Allow-Origin" not in evil.headers
    assert local.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
