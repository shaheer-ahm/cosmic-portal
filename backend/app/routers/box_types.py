from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, require_supervisor
from app.database import get_db


router = APIRouter(
    prefix="/api/v1/box-types",
    tags=["box-types"],
)

SYSTEM_CARTONS = frozenset({"SML", "MED", "LRG"})


@router.get("/", response_model=list[schemas.BoxTypeOut])
def list_box_types(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return (
        db.query(models.BoxType)
        .filter(models.BoxType.Active.is_(True))
        .order_by(models.BoxType.Reference)
        .all()
    )


@router.post(
    "/",
    response_model=schemas.BoxTypeOut,
    status_code=status.HTTP_201_CREATED,
)
def create_box_type(
    data: schemas.BoxTypeCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_supervisor),
):
    """
    Add a custom box type to the shared catalogue.

    Supervisor only.

    If a previously deactivated custom box uses the same reference,
    reactivate it with the newly supplied values.
    """

    reference = data.Reference.strip().upper()

    if not reference:
        raise HTTPException(
            status_code=422,
            detail="Box reference cannot be empty.",
        )

    # SML, MED and LRG are reserved system cartons.
    if reference in SYSTEM_CARTONS:
        raise HTTPException(
            status_code=409,
            detail="This reference is reserved for a system carton.",
        )

    existing = (
        db.query(models.BoxType)
        .filter(models.BoxType.Reference == reference)
        .first()
    )

    if existing:
        # An active box with this reference already exists.
        if existing.Active:
            raise HTTPException(
                status_code=409,
                detail=f"Box type '{reference}' already exists.",
            )

        # Reactivate a previously deactivated custom carton
        # using the new values.
        existing.Width = data.Width
        existing.Length = data.Length
        existing.Depth = data.Depth
        existing.MaxWeight = data.MaxWeight
        existing.BoxWeight = data.BoxWeight
        existing.MaximumBoxes = data.MaximumBoxes
        existing.Active = True

        try:
            db.commit()
            db.refresh(existing)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="A box with this reference already exists.",
            )

        return existing

    box = models.BoxType(
        Reference=reference,
        Width=data.Width,
        Length=data.Length,
        Depth=data.Depth,
        MaxWeight=data.MaxWeight,
        BoxWeight=data.BoxWeight,
        MaximumBoxes=data.MaximumBoxes,
        Active=True,
    )

    try:
        db.add(box)
        db.commit()
        db.refresh(box)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A box with this reference already exists.",
        )

    return box


@router.delete(
    "/{reference}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_custom_box_type(
    reference: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_supervisor),
):
    """
    Soft-delete a custom box type.

    Default system cartons cannot be deleted, and custom cartons
    cannot be deactivated while unfinished orders still depend on them.
    """

    reference = reference.strip().upper()

    # Protect the default system cartons.
    if reference in SYSTEM_CARTONS:
        raise HTTPException(
            status_code=403,
            detail="Default system cartons cannot be deleted.",
        )

    box = (
        db.query(models.BoxType)
        .filter(models.BoxType.Reference == reference)
        .first()
    )

    if box is None:
        raise HTTPException(
            status_code=404,
            detail="Custom carton not found.",
        )

    if not box.Active:
        raise HTTPException(
            status_code=409,
            detail="This carton is already inactive.",
        )

    # Do not deactivate a carton while unfinished orders
    # still depend on it.
    in_use = (
        db.query(models.OrderBoxType)
        .join(
            models.Order,
            models.Order.order_id == models.OrderBoxType.order_id,
        )
        .filter(
            models.OrderBoxType.Reference == reference,
            models.Order.status != "completed",
        )
        .first()
    )

    if in_use is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "This carton is assigned to an unfinished order. "
                "It cannot be deactivated until those orders "
                "no longer depend on it."
            ),
        )

    # Soft deletion preserves completed orders and their
    # historical box references.
    box.Active = False
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )