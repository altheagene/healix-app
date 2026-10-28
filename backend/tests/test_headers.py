def test_api_responses_carry_security_headers(client, headers):
    response = client.get("/getallservices", headers=headers("staff"))
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cache-Control"] == "no-store"
    assert "default-src 'none'" in response.headers["Content-Security-Policy"]
    assert "Strict-Transport-Security" not in response.headers  # plain http in tests


def test_hsts_is_sent_over_https(client, headers):
    response = client.get("/getallservices", headers=headers("staff"), base_url="https://localhost")
    assert response.headers["Strict-Transport-Security"].startswith("max-age=")


def test_error_responses_carry_headers_too(client):
    response = client.get("/getallservices")
    assert response.status_code == 401
    assert response.headers["Cache-Control"] == "no-store"
