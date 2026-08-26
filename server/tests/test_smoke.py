"""End-to-end smoke test of the vertical slice: auth → create → AI category → list."""


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_register_login_and_ai_categorized_transaction(client):
    # Register returns a token + user, and auto-creates a default account.
    resp = await client.post(
        "/auth/register",
        json={"email": "KFC@Example.com", "password": "secret1", "name": "Ada"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["user"]["email"] == "kfc@example.com"  # normalized lowercase

    # Login with the same credentials.
    resp = await client.post(
        "/auth/login", json={"email": "kfc@example.com", "password": "secret1"}
    )
    assert resp.status_code == 200, resp.text
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    # Create a transaction — the (stubbed) AI classifies it as Food.
    resp = await client.post(
        "/transactions",
        json={"amount": 550, "description": "KFC", "type": "expense"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["ai_suggested"] is True
    assert body["category"]["name"] == "Food"
    assert body["amount"] == 550.0
    assert body["description"] == "KFC"

    # It shows up in the list.
    resp = await client.get("/transactions", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["description"] == "KFC"


async def test_login_rejects_bad_password(client):
    await client.post(
        "/auth/register",
        json={"email": "u@example.com", "password": "secret1", "name": "U"},
    )
    resp = await client.post(
        "/auth/login", json={"email": "u@example.com", "password": "wrong"}
    )
    assert resp.status_code == 401


async def test_transactions_require_auth(client):
    resp = await client.get("/transactions")
    assert resp.status_code == 401
