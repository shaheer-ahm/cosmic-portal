from fastapi import APIRouter, Depends, HTTPException
from app import schemas
from app.database import get_db

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

@router.get("/")
def list_orders(db=Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
        return cursor.fetchall()


@router.get("/{order_id}")
def get_order(order_id: int, db=Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

        cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
        order["items"] = cursor.fetchall()
    return order


@router.post("/", status_code=201)
def create_order(order: schemas.OrderCreate, db=Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("INSERT INTO orders (status) VALUES ('draft')")
        db.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM orders WHERE order_id = %s", (new_id,))
        return cursor.fetchone()


def _ensure_order_exists(cursor, order_id: int):
    cursor.execute("SELECT 1 FROM orders WHERE order_id = %s", (order_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")