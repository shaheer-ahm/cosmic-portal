import os
from types import SimpleNamespace
from unittest.mock import Mock, call
from pydantic import ValidationError

import pytest
from fastapi import HTTPException

# Safe test-only settings
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.routers import orders

OWNER_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "22222222-2222-2222-2222-222222222222"


def make_user(user_id = OWNER_ID, role = "USER"):
    return {
        "user_id": user_id,
        "email": "test@example.com",
        "role": role,
    }


def setup_order(monkeypatch, status, created_by):
    order = SimpleNamespace(order_id = 42, status = status, created_by = created_by)
    db = Mock()

    monkeypatch.setattr(orders, "_get_order_or_404", lambda supplied_db, order_id: order)
    return order, db


def test_create_order_records_authenticated_user():
    db = Mock()
    user = make_user()

    created_order = orders.create_order(
        order = orders.schemas.OrderCreate(),
        db = db,
        user = user,
    )

    assert created_order.status == "draft"
    assert created_order.created_by == OWNER_ID
    db.add.assert_called_once_with(created_order)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(created_order)


@pytest.mark.parametrize("status", ["draft", "invalid"])
def test_owner_can_delete_unfinished_order(monkeypatch, status):
    order, db = setup_order(monkeypatch, status, OWNER_ID)
    response = orders.delete_order(order_id = 42, db = db, user = make_user())

    assert response.status_code == 204
    db.delete.assert_called_once_with(order)
    db.commit.assert_called_once()


@pytest.mark.parametrize("status", ["draft", "invalid", "validated", "completed"])
def test_supervisor_can_delete_non_processing_order(monkeypatch, status):
    order, db = setup_order(monkeypatch, status, None)
    response = orders.delete_order(order_id = 42, db = db, user = make_user(role = "SUPERVISOR"))

    assert response.status_code == 204
    db.delete.assert_called_once_with(order)
    db.commit.assert_called_once()


def test_user_cannot_delete_another_users_order(monkeypatch):
    _, db = setup_order(monkeypatch, "draft", OTHER_ID)

    with pytest.raises(HTTPException) as error:
        orders.delete_order(order_id = 42, db = db, user = make_user())

    assert error.value.status_code == 403
    db.delete.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.parametrize("status", ["validated", "completed"])
def test_owner_cannot_delete_advanced_order(monkeypatch, status):
    _, db = setup_order(monkeypatch, status, OWNER_ID)

    with pytest.raises(HTTPException) as error:
        orders.delete_order(order_id = 42, db = db, user = make_user())

    assert error.value.status_code == 409
    db.delete.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.parametrize("role", ["USER", "SUPERVISOR"])
def test_processing_order_cannot_be_deleted(monkeypatch, role):
    _, db = setup_order(monkeypatch, "processing", OWNER_ID)

    with pytest.raises(HTTPException) as error:
        orders.delete_order(order_id = 42, db = db, user = make_user(role = role))
    assert error.value.status_code == 409
    db.delete.assert_not_called()
    db.commit.assert_not_called()


def setup_bulk_db(order_list):
    db = Mock()
    db.query.return_value.filter.return_value.all.return_value = order_list

    return db


def test_bulk_request_removes_duplicate_ids():
    request = orders.schemas.BulkOrderDeleteRequest(
        order_ids = [3, 1, 3, 2, 1],
    )

    assert request.order_ids == [3, 1, 2]


@pytest.mark.parametrize(
    "order_ids",
    [
        [],
        [0],
        list(range(1, 202)),
    ],
)
def test_bulk_request_rejects_invalid_selections(order_ids):
    with pytest.raises(ValidationError):
        orders.schemas.BulkOrderDeleteRequest(order_ids = order_ids)


def test_supervisor_can_bulk_delete_allowed_orders():
    first = SimpleNamespace(
        order_id = 1,
        status = "completed",
        created_by = None,
    )
    second = SimpleNamespace(
        order_id = 2,
        status = "validated",
        created_by = OTHER_ID,
    )
    db = setup_bulk_db([first, second])

    result = orders.bulk_delete_orders(
        request = orders.schemas.BulkOrderDeleteRequest(order_ids = [1, 2]),
        db = db,
        user = make_user(role="SUPERVISOR"),
    )

    assert result.deleted_order_ids == [1, 2]
    assert result.deleted_count == 2
    assert db.delete.call_args_list == [
        call(first),
        call(second),
    ]
    db.commit.assert_called_once()


def test_owner_can_bulk_delete_own_unfinished_orders():
    first = SimpleNamespace(
        order_id = 1,
        status = "draft",
        created_by = OWNER_ID,
    )
    second = SimpleNamespace(
        order_id = 2,
        status = "invalid",
        created_by = OWNER_ID,
    )
    db = setup_bulk_db([first, second])

    result = orders.bulk_delete_orders(
        request = orders.schemas.BulkOrderDeleteRequest(order_ids = [1, 2]),
        db = db,
        user = make_user(),
    )

    assert result.deleted_count == 2
    assert db.delete.call_count == 2
    db.commit.assert_called_once()


def test_bulk_delete_is_all_or_nothing_for_unowned_order():
    owned = SimpleNamespace(
        order_id = 1,
        status = "draft",
        created_by = OWNER_ID,
    )
    unowned = SimpleNamespace(
        order_id = 2,
        status = "draft",
        created_by = OTHER_ID,
    )
    db = setup_bulk_db([owned, unowned])

    with pytest.raises(HTTPException) as error:
        orders.bulk_delete_orders(
            request=orders.schemas.BulkOrderDeleteRequest(order_ids = [1, 2]),
            db = db,
            user = make_user(),
        )

    assert error.value.status_code == 403
    db.delete.assert_not_called()
    db.commit.assert_not_called()


def test_bulk_delete_is_all_or_nothing_for_processing_order():
    completed = SimpleNamespace(
        order_id = 1,
        status = "completed",
        created_by = None,
    )
    processing = SimpleNamespace(
        order_id = 2,
        status = "processing",
        created_by = None,
    )
    db = setup_bulk_db([completed, processing])

    with pytest.raises(HTTPException) as error:
        orders.bulk_delete_orders(
            request=orders.schemas.BulkOrderDeleteRequest(order_ids = [1, 2]),
            db = db,
            user = make_user(role="SUPERVISOR"),
        )

    assert error.value.status_code == 409
    db.delete.assert_not_called()
    db.commit.assert_not_called()


def test_bulk_delete_rejects_missing_order_without_deleting():
    existing = SimpleNamespace(
        order_id = 1,
        status = "draft",
        created_by = OWNER_ID,
    )
    db = setup_bulk_db([existing])

    with pytest.raises(HTTPException) as error:
        orders.bulk_delete_orders(
            request = orders.schemas.BulkOrderDeleteRequest(order_ids=[1, 999]),
            db = db,
            user = make_user(),
        )

    assert error.value.status_code == 404
    db.delete.assert_not_called()
    db.commit.assert_not_called()