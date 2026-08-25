from fastapi import APIRouter, Depends, HTTPException
from app import schemas
from app.database import get_db
from app.routers.orders import _ensure_order_exists

router = APIRouter(prefix="/api/v1/orders/{order_id}/items", tags=["items"])


@router.get("/")
def list_items(order_id: int, db=Depends(get_db)):
    with db.cursor() as cursor:
        _ensure_order_exists(cursor, order_id)
        cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
        return cursor.fetchall()


@router.get("/{item_id}")
def get_item(order_id: int, item_id: str, db=Depends(get_db)):
    with db.cursor() as cursor:
        _ensure_order_exists(cursor, order_id)
        cursor.execute(
            "SELECT * FROM order_items WHERE order_id = %s AND ItemCode = %s",
            (order_id, item_id),
        )
        item = cursor.fetchone()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")
    return item


@router.post("/", status_code=201)
def create_item(order_id: int, item: schemas.ItemCreate, db=Depends(get_db)):
    with db.cursor() as cursor:
        _ensure_order_exists(cursor, order_id)

        cursor.execute(
            "SELECT 1 FROM order_items WHERE order_id = %s AND ItemCode = %s",
            (order_id, item.ItemCode),
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=409,
                detail=f"Item '{item.ItemCode}' already exists in order {order_id}",
            )

        cursor.execute(
            """
            INSERT INTO order_items (order_id, ItemCode, ItemReference, Width, Length, Depth, BoxGroup)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (order_id, item.ItemCode, item.ItemReference, item.Width, item.Length, item.Depth, item.BoxGroup),
        )
        db.commit()
    return item


@router.put("/{item_id}")
def update_item(order_id: int, item_id: str, item: schemas.ItemCreate, db=Depends(get_db)):
    with db.cursor() as cursor:
        _ensure_order_exists(cursor, order_id)

        cursor.execute(
            "SELECT 1 FROM order_items WHERE order_id = %s AND ItemCode = %s",
            (order_id, item_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")

        cursor.execute(
            """
            UPDATE order_items
            SET ItemCode = %s, ItemReference = %s, Width = %s, Length = %s, Depth = %s, BoxGroup = %s
            WHERE order_id = %s AND ItemCode = %s
            """,
            (item.ItemCode, item.ItemReference, item.Width, item.Length, item.Depth, item.BoxGroup, order_id, item_id),
        )
        db.commit()
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(order_id: int, item_id: str, db=Depends(get_db)):
    with db.cursor() as cursor:
        _ensure_order_exists(cursor, order_id)

        cursor.execute(
            "SELECT 1 FROM order_items WHERE order_id = %s AND ItemCode = %s",
            (order_id, item_id),
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found in order {order_id}")

        cursor.execute(
            "DELETE FROM order_items WHERE order_id = %s AND ItemCode = %s",
            (order_id, item_id),
        )
        db.commit()
    return None