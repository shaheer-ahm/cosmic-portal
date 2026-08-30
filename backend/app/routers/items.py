from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.orders import _get_order_or_404

router = APIRouter(prefix="/api/v1/orders/{order_id}/items", tags=["items"])


@router.get("/", response_model=list[schemas.ItemOut])
def list_items(order_id: int, db: Session = Depends(get_db)):
    _get_order_or_404(db, order_id)
    return db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()


@router.get("/{item_id}", response_model=schemas.ItemOut)
def get_item(order_id: int, item_id: str, db: Session = Depends(get_db)):
    _get_order_or_404(db, order_id)
    item = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id, models.OrderItem.ItemCode == item_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")
    return item


@router.post("/", response_model=schemas.ItemOut, status_code=201)
def create_item(order_id: int, item: schemas.ItemCreate, db: Session = Depends(get_db)):
    _get_order_or_404(db, order_id)

    existing = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id, models.OrderItem.ItemCode == item.ItemCode
    ).first()
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Item '{item.ItemCode}' already exists in order {order_id}"
        )

    db_item = models.OrderItem(order_id=order_id, **item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=schemas.ItemOut)
def update_item(order_id: int, item_id: str, item: schemas.ItemCreate, db: Session = Depends(get_db)):
    _get_order_or_404(db, order_id)

    db_item = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id, models.OrderItem.ItemCode == item_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")

    for field, value in item.model_dump().items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=204)
def delete_item(order_id: int, item_id: str, db: Session = Depends(get_db)):
    _get_order_or_404(db, order_id)

    db_item = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id, models.OrderItem.ItemCode == item_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")

    db.delete(db_item)
    db.commit()
    return None