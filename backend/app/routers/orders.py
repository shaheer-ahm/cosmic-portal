from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from uuid import uuid4

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_supervisor
from app.solver_client import call_solver, SolverError

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.get("/", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=schemas.OrderWithItemsOut)
def get_order(order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    return _order_with_box_types(order)


@router.post("/", response_model=schemas.OrderOut, status_code=201)
def create_order(
    order: schemas.OrderCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    db_order = models.Order(status="draft")
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


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
def validate_order(order_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """
    Checks that the order has items, has at least one box type selected,
    and that every item fits inside at least one selected box type. 
    Sets order.status to 'validated' or 'invalid' accordingly.
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
            if not any(_item_fits_box(item, box) for box in box_types):
                issues.append(
                    schemas.ValidationIssue(
                        field=item.ItemCode,
                        message=f"Item '{item.ItemCode}' does not fit in any selected box type",
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

def _get_order_or_404(db: Session, order_id: int) -> models.Order:
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order

def _order_with_box_types(order: models.Order) -> schemas.OrderWithItemsOut:
    return schemas.OrderWithItemsOut(
        order_id=order.order_id,
        status=order.status,
        created_at=order.created_at,
        items=[schemas.ItemOut.model_validate(item) for item in order.items],
        box_types=[obt.Reference for obt in order.box_types],
    )