from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from uuid import uuid4

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_supervisor
from app.solver_client import call_solver, SolverError

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.get("/", response_model=list[schemas.OrderSummaryOut])
def list_orders(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    item_counts = (
        db.query(
            models.OrderItem.order_id.label("order_id"),
            func.count(models.OrderItem.ItemCode).label("items_count"),
        )
        .group_by(models.OrderItem.order_id)
        .subquery()
    )

    box_counts = (
        db.query(
            models.OrderBoxType.order_id.label("order_id"),
            func.count(models.OrderBoxType.Reference).label("boxes_count"),
        )
        .group_by(models.OrderBoxType.order_id)
        .subquery()
    )

    rows = (
        db.query(
            models.Order,
            func.coalesce(item_counts.c.items_count, 0).label("items_count"),
            func.coalesce(box_counts.c.boxes_count, 0).label("boxes_count"),
        )
        .outerjoin(
            item_counts,
            item_counts.c.order_id == models.Order.order_id,
        )
        .outerjoin(
            box_counts,
            box_counts.c.order_id == models.Order.order_id,
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [
        schemas.OrderSummaryOut(
            order_id=order.order_id,
            status=order.status,
            created_by=order.created_by,
            created_at=order.created_at,
            items_count=items_count,
            boxes_count=boxes_count,
        )
        for order, items_count, boxes_count in rows
    ]


@router.get("/{order_id}", response_model=schemas.OrderWithItemsOut)
def get_order(order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    return _order_with_box_types(order)


@router.post("/", response_model=schemas.OrderOut, status_code=201)
def create_order(
    order: schemas.OrderCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    db_order = models.Order(status="draft", created_by=user["user_id"])
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.post("/bulk-delete", response_model = schemas.BulkOrderDeleteResponse)
def bulk_delete_orders(request: schemas.BulkOrderDeleteRequest, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    requested_ids = request.order_ids
    found_orders = db.query(models.Order).filter(models.Order.order_id.in_(requested_ids)).all()

    orders_by_id = {
        order.order_id: order
        for order in found_orders
    }

    missing_ids = [
        order_id
        for order_id in requested_ids
        if order_id not in orders_by_id
    ]

    if missing_ids:
        raise HTTPException(
            status_code = 404,
            detail = (
                "Order(s) not found: "
                + ", ".join(
                    str(order_id)
                    for order_id in missing_ids
                )
            ),
        )

    for order_id in requested_ids:
        _ensure_order_can_be_deleted(orders_by_id[order_id], user)

    for order_id in requested_ids:
        db.delete(orders_by_id[order_id])

    db.commit()
    return schemas.BulkOrderDeleteResponse(deleted_order_ids = requested_ids, deleted_count = len(requested_ids))


@router.delete("/{order_id}", status_code = 204)
def delete_order(order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    _ensure_order_can_be_deleted(order, user)

    db.delete(order)
    db.commit()
    return Response(status_code = 204)


# Box type selection

@router.post("/{order_id}/box-types", response_model=schemas.OrderWithItemsOut)
def set_order_box_types(
    order_id: int,
    selection: schemas.BoxTypeSelectionIn,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Replaces the full set of box types available for this order with the
    given list of References.
    """
    order = _get_order_or_404(db, order_id)

    if not selection.references:
        raise HTTPException(status_code=422, detail="At least one box type reference must be provided")

    found = (
        db.query(models.BoxType)
        .filter(models.BoxType.Reference.in_(selection.references))
        .all()
    )
    found_refs = {b.Reference for b in found}
    missing = set(selection.references) - found_refs
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown box type reference(s): {', '.join(sorted(missing))}",
        )

    inactive = [b.Reference for b in found if not b.Active]
    if inactive:
        raise HTTPException(
            status_code=400,
            detail=f"Inactive box type(s) cannot be selected: {', '.join(sorted(inactive))}",
        )

    # Replace existing selection
    db.query(models.OrderBoxType).filter(models.OrderBoxType.order_id == order_id).delete()
    for ref in selection.references:
        db.add(models.OrderBoxType(order_id=order_id, Reference=ref))
    db.commit()
    db.refresh(order)

    return _order_with_box_types(order)

@router.get("/{order_id}/box-types", response_model=list[schemas.BoxTypeOut])
def get_selected_box_types(
    order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    _get_order_or_404(db, order_id)
    return (
        db.query(models.BoxType)
        .join(models.OrderBoxType, models.BoxType.Reference == models.OrderBoxType.Reference)
        .filter(models.OrderBoxType.order_id == order_id)
        .order_by(models.BoxType.Reference)
        .all()
    )

@router.delete("/{order_id}/box-types/{reference}", status_code=204)
def remove_selected_box_type(
    order_id: int, reference: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    _get_order_or_404(db, order_id)
    selection = (
        db.query(models.OrderBoxType)
        .filter(models.OrderBoxType.order_id == order_id, models.OrderBoxType.Reference == reference)
        .first()
    )
    if not selection:
        raise HTTPException(
            status_code=404, detail=f"Box type '{reference}' is not selected for order {order_id}"
        )
    db.delete(selection)
    db.commit()
    return Response(status_code=204)

# Validation

@router.post("/{order_id}/validate", response_model=schemas.ValidateResponse)
def validate_order(order_id: int, db: Session = Depends(get_db), user: dict = Depends(require_supervisor)):
    """
    Checks that the order has items, has at least one box type selected,
    and that every item fits inside at least one selected box type. 
    Sets order.status to 'validated' or 'invalid' accordingly.
    Supervisor only.
    """
    order = _get_order_or_404(db, order_id)
    issues: list[schemas.ValidationIssue] = []

    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    if not items:
        issues.append(schemas.ValidationIssue(field="items", message="Order has no items"))

    box_type_refs = [obt.Reference for obt in order.box_types]
    if not box_type_refs:
        issues.append(
            schemas.ValidationIssue(field="box_types", message="No box types selected for this order")
        )

    if items and box_type_refs:
        box_types = (
            db.query(models.BoxType)
            .filter(models.BoxType.Reference.in_(box_type_refs))
            .all()
        )
        for item in items:
            boxes_it_fits = [box for box in box_types if _item_fits_box(item, box)]
            if not boxes_it_fits:
                issues.append(
                    schemas.ValidationIssue(
                        field=item.ItemCode,
                        message=f"Item '{item.ItemCode}' does not fit in any selected box type",
                    )
                )
            elif not any(_box_can_hold_weight(item, box) for box in boxes_it_fits):
                issues.append(
                    schemas.ValidationIssue(
                        field=item.ItemCode,
                        message=(
                            f"Item '{item.ItemCode}' ({item.Weight:g} kg) is heavier than "
                            "any selected box it fits in can hold"
                        ),
                    )
                )

    valid = len(issues) == 0
    order.status = "validated" if valid else "invalid"
    db.commit()

    return schemas.ValidateResponse(valid=valid, status=order.status, issues=issues)


def _item_fits_box(item: "models.OrderItem", box: "models.BoxType") -> bool:
    """
    True if the item's dimensions fit inside the box in some rotation
    """
    item_dims = sorted([item.Width, item.Length, item.Depth])
    box_dims = sorted([box.Width, box.Length, box.Depth])
    return all(i <= b for i, b in zip(item_dims, box_dims))

def _box_can_hold_weight(item: "models.OrderItem", box: "models.BoxType") -> bool:
    """True if one unit of the item is within the box's MaxWeight (no limit if unset)."""
    return box.MaxWeight is None or item.Weight <= box.MaxWeight

# Status

@router.get("/{order_id}/status", response_model=schemas.OrderStatusOut)
def get_order_status(
    order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    order = _get_order_or_404(db, order_id)
    return schemas.OrderStatusOut(order_id=order.order_id, status=order.status)


# Results

@router.get("/{order_id}/results", response_model=schemas.OrderResultOut)
def get_order_results(
    order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    _get_order_or_404(db, order_id)
    result = (
        db.query(models.OrderResult)
        .filter(models.OrderResult.order_id == order_id)
        .first()
    )
    if not result:
        raise HTTPException(
            status_code=404, detail=f"No results available for order {order_id} yet"
        )
    return result


# Optimisation

@router.post("/{order_id}/optimise", response_model=schemas.OptimiseResponse)
def optimise_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_supervisor),
):
    order = _get_order_or_404(db, order_id)

    if order.status != "validated":
        raise HTTPException(
            status_code=409,
            detail=f"Order must be validated before optimisation (current status: '{order.status}')",
        )
    
    items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
    box_type_refs = [obt.Reference for obt in order.box_types]
    box_types = (
        db.query(models.BoxType)
        .filter(models.BoxType.Reference.in_(box_type_refs), models.BoxType.Active.is_(True))
        .all()
    )

    if not box_types:
        raise HTTPException(
            status_code=400,
            detail="None of this order's selected box types are currently active",
        )
    
    order.status = "processing"
    db.commit()

    try:
        result = call_solver(items, box_types, request_id=f"portal-order-{order_id}-{uuid4()}")
    except SolverError as exc:
        # Roll back to 'validated' so the order can be retried rather than
        # left stuck in 'processing'.
        order.status = "validated"
        db.commit()
        raise HTTPException(status_code=502, detail=f"FitSolver call failed: {exc}")

    existing_result = (
        db.query(models.OrderResult).filter(models.OrderResult.order_id == order_id).first()
    )
    result_dict = result.model_dump(mode="json")
    if existing_result:
        existing_result.result_data = result_dict
    else:
        db.add(models.OrderResult(order_id=order_id, result_data=result_dict))

    order.status = "completed"
    db.commit()

    message = (
        "Optimisation completed successfully."
        if result.Success
        else f"Optimisation completed with {len(result.UnpackedItems)} item(s) unpacked."
    )

    return schemas.OptimiseResponse(order_id=order.order_id, status=order.status, message=message)


# Helpers

def _ensure_order_can_be_deleted(order: models.Order, user: dict) -> None:
    order_status = order.status.lower()

    if order_status == "processing":
        raise HTTPException(
            status_code = 409, detail = (
                f"Order {order.order_id} cannot be deleted "
                "while optimisation is processing"
                ),
        )

    is_supervisor = user.get("role") == "SUPERVISOR"
    is_owner = order.created_by is not None and str(order.created_by).lower() == str(user.get("user_id", "")).lower()

    if is_supervisor:
        return

    if not is_owner:
        raise HTTPException(status_code = 403, detail = f"You may only delete orders that you created (order {order.order_id})")

    if order_status not in {"draft", "invalid"}:
        raise HTTPException(
            status_code = 409,
            detail = (
                "Users may only delete their own draft or "
                f"invalid orders (order {order.order_id})"
            ),
        )


def _get_order_or_404(db: Session, order_id: int) -> models.Order:
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order

def _order_with_box_types(order: models.Order) -> schemas.OrderWithItemsOut:
    return schemas.OrderWithItemsOut(
        order_id=order.order_id,
        status=order.status,
        created_by=order.created_by,
        created_at=order.created_at,
        items=[schemas.ItemOut.model_validate(item) for item in order.items],
        box_types=[obt.Reference for obt in order.box_types],
    )