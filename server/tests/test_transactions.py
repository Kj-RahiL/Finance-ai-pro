"""Transaction business rules: balances, AI/fallback categories, edits, filters, ownership."""
from tests.conftest import register


async def _accounts(client, auth):
    resp = await client.get("/accounts", headers=auth)
    assert resp.status_code == 200
    return resp.json()


async def _categories_by_name(client, auth):
    resp = await client.get("/categories", headers=auth)
    return {c["name"]: c for c in resp.json()}


async def test_expense_and_income_move_the_account_balance(client, auth):
    (cash,) = await _accounts(client, auth)
    assert cash["balance"] == 0

    await client.post("/transactions", json={"amount": 550, "description": "KFC"}, headers=auth)
    resp = await client.post(
        "/transactions",
        json={"amount": 30000, "description": "Salary", "type": "income"},
        headers=auth,
    )
    assert resp.status_code == 201, resp.text
    income = resp.json()
    # Income never gets an expense category: the only income category is "Income",
    # so no AI call is needed and ai_suggested stays False.
    assert income["category"]["name"] == "Income"
    assert income["ai_suggested"] is False

    (cash,) = await _accounts(client, auth)
    assert cash["balance"] == 30000 - 550


async def test_explicit_category_skips_ai_and_must_match_type(client, auth):
    cats = await _categories_by_name(client, auth)

    resp = await client.post(
        "/transactions",
        json={"amount": 100, "description": "CNG", "category_id": cats["Transport"]["id"]},
        headers=auth,
    )
    assert resp.status_code == 201
    assert resp.json()["category"]["name"] == "Transport"
    assert resp.json()["ai_suggested"] is False

    # An expense category on an income transaction is a business-rule violation.
    resp = await client.post(
        "/transactions",
        json={
            "amount": 100,
            "description": "Bonus",
            "type": "income",
            "category_id": cats["Food"]["id"],
        },
        headers=auth,
    )
    assert resp.status_code == 400
    assert "income" in resp.json()["detail"]


async def test_user_can_correct_ai_category(client, auth):
    cats = await _categories_by_name(client, auth)
    created = (
        await client.post("/transactions", json={"amount": 550, "description": "KFC"}, headers=auth)
    ).json()
    assert created["ai_suggested"] is True

    resp = await client.patch(
        f"/transactions/{created['id']}",
        json={"category_id": cats["Entertainment"]["id"]},
        headers=auth,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["category"]["name"] == "Entertainment"
    assert resp.json()["ai_suggested"] is False  # user-confirmed now

    (cash,) = await _accounts(client, auth)
    assert cash["balance"] == -550  # unchanged by a category edit


async def test_update_amount_type_and_account_rebalances(client, auth):
    other = (
        await client.post(
            "/accounts", json={"name": "bKash", "type": "mobile", "balance": 1000}, headers=auth
        )
    ).json()
    created = (
        await client.post("/transactions", json={"amount": 200, "description": "Rickshaw"}, headers=auth)
    ).json()

    # Move it to bKash, make it income, and change the amount.
    resp = await client.patch(
        f"/transactions/{created['id']}",
        json={"account_id": other["id"], "type": "income", "amount": 250},
        headers=auth,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["account_id"] == other["id"]
    assert body["category"]["name"] == "Income"  # type flipped → category re-resolved

    balances = {a["name"]: a["balance"] for a in await _accounts(client, auth)}
    assert balances["Cash"] == 0          # old effect reversed
    assert balances["bKash"] == 1000 + 250  # new effect applied


async def test_delete_restores_balance(client, auth):
    created = (
        await client.post("/transactions", json={"amount": 999, "description": "Shoes"}, headers=auth)
    ).json()
    resp = await client.delete(f"/transactions/{created['id']}", headers=auth)
    assert resp.status_code == 204

    (cash,) = await _accounts(client, auth)
    assert cash["balance"] == 0
    assert (await client.get(f"/transactions/{created['id']}", headers=auth)).status_code == 404


async def test_list_filters_and_pagination(client, auth):
    cats = await _categories_by_name(client, auth)
    rows = [
        {"amount": 100, "description": "Uber", "date": "2026-09-01", "category_id": cats["Transport"]["id"]},
        {"amount": 200, "description": "Bazar", "date": "2026-09-05"},
        {"amount": 300, "description": "Salary", "type": "income", "date": "2026-08-30"},
    ]
    for row in rows:
        assert (await client.post("/transactions", json=row, headers=auth)).status_code == 201

    page = (await client.get("/transactions", headers=auth)).json()
    assert page["total"] == 3
    assert [t["description"] for t in page["items"]] == ["Bazar", "Uber", "Salary"]  # date desc

    page = (await client.get("/transactions", params={"type": "expense"}, headers=auth)).json()
    assert page["total"] == 2

    page = (
        await client.get(
            "/transactions", params={"date_from": "2026-09-01", "date_to": "2026-09-30"}, headers=auth
        )
    ).json()
    assert {t["description"] for t in page["items"]} == {"Uber", "Bazar"}

    page = (await client.get("/transactions", params={"q": "uber"}, headers=auth)).json()
    assert page["total"] == 1 and page["items"][0]["description"] == "Uber"

    page = (
        await client.get("/transactions", params={"category_id": cats["Transport"]["id"]}, headers=auth)
    ).json()
    assert page["total"] == 1

    page = (await client.get("/transactions", params={"limit": 2, "offset": 2}, headers=auth)).json()
    assert page["total"] == 3 and len(page["items"]) == 1


async def test_transactions_are_isolated_per_user(client, auth):
    created = (
        await client.post("/transactions", json={"amount": 10, "description": "Tea"}, headers=auth)
    ).json()
    other = await register(client, email="bob@example.com", name="Bob")

    assert (await client.get("/transactions", headers=other)).json()["total"] == 0
    assert (await client.get(f"/transactions/{created['id']}", headers=other)).status_code == 404
    assert (
        await client.patch(f"/transactions/{created['id']}", json={"amount": 1}, headers=other)
    ).status_code == 404
    assert (await client.delete(f"/transactions/{created['id']}", headers=other)).status_code == 404

    # Nor can Bob post into Ada's account.
    (ada_cash,) = await _accounts(client, auth)
    resp = await client.post(
        "/transactions",
        json={"amount": 5, "description": "x", "account_id": ada_cash["id"]},
        headers=other,
    )
    assert resp.status_code == 404


async def test_monthly_summary(client, auth):
    for row in [
        {"amount": 100, "description": "Uber", "date": "2026-09-01"},
        {"amount": 200, "description": "Bazar", "date": "2026-09-05"},
        {"amount": 1000, "description": "Salary", "type": "income", "date": "2026-09-02"},
        {"amount": 999, "description": "Old", "date": "2026-08-30"},
    ]:
        await client.post("/transactions", json=row, headers=auth)

    resp = await client.get("/dashboard/summary", params={"year": 2026, "month": 9}, headers=auth)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["income"] == 1000
    assert body["expense"] == 300
    assert body["net"] == 700
    assert body["transaction_count"] == 3
    assert body["total_balance"] == 1000 - 300 - 999


async def test_spending_by_category(client, auth):
    cats = await _categories_by_name(client, auth)
    for row in [
        {"amount": 300, "description": "KFC", "date": "2026-09-01"},                                   # AI → Food
        {"amount": 100, "description": "Uber", "date": "2026-09-02", "category_id": cats["Transport"]["id"]},
        {"amount": 100, "description": "CNG", "date": "2026-09-03", "category_id": cats["Transport"]["id"]},
        {"amount": 5000, "description": "Salary", "type": "income", "date": "2026-09-02"},           # ignored
        {"amount": 999, "description": "Old", "date": "2026-08-30"},                                  # other month
    ]:
        assert (await client.post("/transactions", json=row, headers=auth)).status_code == 201

    resp = await client.get("/dashboard/categories", params={"year": 2026, "month": 9}, headers=auth)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total_expense"] == 500
    assert [(i["name"], i["total"], i["count"]) for i in body["items"]] == [("Food", 300, 1), ("Transport", 200, 2)]
    assert body["items"][0]["share"] == 0.6
