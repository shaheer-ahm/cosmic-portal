from fastapi import APIRouter, Depends, HTTPException
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