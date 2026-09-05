from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.get("/", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=schemas.OrderWithItemsOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@router.post("/", response_model=schemas.OrderOut, status_code=201)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = models.Order(status="draft")
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def _get_order_or_404(db: Session, order_id: int) -> models.Order:
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@router.post("/{order_id}/box-types/", response_model = schemas.OrderBoxTypeResponse, status_code = 201)
def select_box_type(order_id: int, selection: schemas.OrderBoxTypeCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code = 404, detail = "Order not found")

    box_type = db.query(models.BoxType).filter(models.BoxType.Reference == selection.box_reference).first()
    if box_type is None:
        raise HTTPException(status_code = 404, detail = "Box type not found")
    if not box_type.Active:
        raise HTTPException(status_code = 400, detail = "Inactive box types cannot be selected")

    existing_selection = db.query(models.OrderBoxType).filter(models.OrderBoxType.order_id == order_id, models.OrderBoxType.box_reference == selection.box_reference).first()
    if existing_selection is not None:
        raise HTTPException(status_code = 409, detail = "Box type is already selected for this order")

    order_box_type = models.OrderBoxType(order_id = order_id, box_reference = selection.box_reference)
    db.add(order_box_type)
    db.commit()
    db.refresh(order_box_type)

    return order_box_type


@router.get("/{order_id}/box-types/", response_model = list[schemas.BoxTypeOut])
def get_selected_box_types(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code = 404, detail = "Order not found")

    selected_box_types = (
        db.query(models.BoxType)
        .join(
            models.OrderBoxType, models.BoxType.Reference == models.OrderBoxType.box_reference
        )
        .filter(models.OrderBoxType.order_id == order_id).order_by(models.BoxType.Reference).all()
    )

    return selected_box_types


@router.delete("/{order_id}/box-types/{box_reference}", status_code = 204)
def remove_selected_box_type(order_id: int, box_reference: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code = 404, detail = "Order not found")

    selection = db.query(models.OrderBoxType).filter(models.OrderBoxType.order_id == order_id, models.OrderBoxType.box_reference == box_reference).first()
    if selection is None:
        raise HTTPException(status_code = 404, detail = "Box type selection not found")

    db.delete(selection)
    db.commit()

    return Response(status_code = 204)