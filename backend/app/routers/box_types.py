from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_supervisor

router = APIRouter(prefix="/api/v1/box-types", tags=["box-types"])


@router.get("/", response_model=list[schemas.BoxTypeOut])
def list_box_types(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return (
        db.query(models.BoxType)
        .filter(models.BoxType.Active.is_(True))
        .order_by(models.BoxType.Reference)
        .all()
    )


@router.post("/", response_model=schemas.BoxTypeOut, status_code=201)
def create_box_type(
    box: schemas.BoxTypeCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_supervisor),
):
    """
    Adds a box to the shared catalogue. Supervisor only. 
    Re-creating a previously deleted/inactive reference
    reactivates it with the new values.
    """

    reference = box.Reference.strip().upper()
    values = box.model_dump(exclude={"Reference"})

    existing = db.query(models.BoxType).filter(models.BoxType.Reference == reference).first()
    if existing:
        if existing.Active:
            raise HTTPException(
                status_code=409, detail=f"Box type '{reference}' already exists"
            )
        for field, value in values.items():
            setattr(existing, field, value)
        existing.Active = True
        db.commit()
        db.refresh(existing)
        return existing

    db_box = models.BoxType(Reference=reference, Active=True, **values)
    db.add(db_box)
    db.commit()
    db.refresh(db_box)
    return db_box


@router.delete("/{reference}", status_code=204)
def delete_box_type(
    reference: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_supervisor),
):
    """
    Removes a box from the catalogue for new orders. Soft delete
    so past orders that used it still resolve. Supervisor only.
    """
    box = db.query(models.BoxType).filter(models.BoxType.Reference == reference).first()
    if not box or not box.Active:
        raise HTTPException(status_code=404, detail=f"Box type '{reference}' not found")

    box.Active = False
    db.commit()
    return Response(status_code=204)
