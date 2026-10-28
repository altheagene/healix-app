"""Checks /resetpassword in controllers/staff_controller.py."""


def test_reset_needs_the_current_password(client, headers):
    body = {"current_password": "wrong", "new_password": "brand-new-1"}
    assert client.post("/resetpassword", headers=headers("nurse"), json=body).status_code == 400


def test_reset_signs_out_other_sessions_and_keeps_this_one(client, login):
    this_device = {"Authorization": "Bearer " + login("nurse")}
    other_device = {"Authorization": "Bearer " + login("nurse")}
    body = {"current_password": "correct-horse-1", "new_password": "brand-new-1"}

    response = client.post("/resetpassword", headers=this_device, json=body)
    assert response.json["success"] is True
    fresh = {"Authorization": "Bearer " + response.json["token"]}

    assert client.get("/getallservices", headers=fresh).status_code == 200
    assert client.get("/getallservices", headers=this_device).status_code == 401
    assert client.get("/getallservices", headers=other_device).status_code == 401
    assert login("nurse", "brand-new-1")
