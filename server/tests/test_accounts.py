"""Account CRUD, soft-archive, and ownership."""
from tests.conftest import register


async def test_register_creates_default_cash_account(client, auth):
    resp = await client.get("/accounts", headers=auth)
    assert resp.status_code == 200
    (cash,) = resp.json()
    assert cash["name"] == "Cash"
    assert cash["type"] == "cash"
    assert cash["currency"] == "BDT"
    assert cash["is_archived"] is False


async def test_create_update_and_archive_account(client, auth):
    resp = await client.post(
        "/accounts",
        json={"name": "DBBL", "type": "bank", "balance": 5000, "currency": "BDT"},
        headers=auth,
    )
    assert resp.status_code == 201, resp.text
    bank = resp.json()
    assert bank["balance"] == 5000

    resp = await client.patch(f"/accounts/{bank['id']}", json={"name": "DBBL Savings", "type": "savings"}, headers=auth)
    assert resp.status_code == 200
    assert resp.json()["name"] == "DBBL Savings"
    assert resp.json()["type"] == "savings"

    resp = await client.delete(f"/accounts/{bank['id']}", headers=auth)
    assert resp.status_code == 200
    assert resp.json()["is_archived"] is True

    # Archived accounts are hidden by default but still reachable.
    assert len((await client.get("/accounts", headers=auth)).json()) == 1
    assert len((await client.get("/accounts", params={"include_archived": True}, headers=auth)).json()) == 2

    # …and accept no new transactions.
    resp = await client.post(
        "/transactions", json={"amount": 1, "description": "x", "account_id": bank["id"]}, headers=auth
    )
    assert resp.status_code == 400
    assert "archived" in resp.json()["detail"]

    # Un-archive via PATCH.
    resp = await client.patch(f"/accounts/{bank['id']}", json={"is_archived": False}, headers=auth)
    assert resp.json()["is_archived"] is False


async def test_default_account_skips_archived(client, auth):
    (cash,) = (await client.get("/accounts", headers=auth)).json()
    wallet = (await client.post("/accounts", json={"name": "Nagad", "type": "mobile"}, headers=auth)).json()
    await client.delete(f"/accounts/{cash['id']}", headers=auth)

    resp = await client.post("/transactions", json={"amount": 50, "description": "Tea"}, headers=auth)
    assert resp.status_code == 201
    assert resp.json()["account_id"] == wallet["id"]


async def test_account_validation(client, auth):
    resp = await client.post("/accounts", json={"name": "", "type": "bank"}, headers=auth)
    assert resp.status_code == 422
    resp = await client.post("/accounts", json={"name": "X", "currency": "taka"}, headers=auth)
    assert resp.status_code == 422
    resp = await client.post("/accounts", json={"name": "X", "balance": 1.234}, headers=auth)
    assert resp.status_code == 422


async def test_accounts_are_isolated_per_user(client, auth):
    (cash,) = (await client.get("/accounts", headers=auth)).json()
    other = await register(client, email="bob@example.com", name="Bob")

    assert (await client.get(f"/accounts/{cash['id']}", headers=other)).status_code == 404
    assert (await client.patch(f"/accounts/{cash['id']}", json={"name": "hack"}, headers=other)).status_code == 404
    assert (await client.delete(f"/accounts/{cash['id']}", headers=other)).status_code == 404
