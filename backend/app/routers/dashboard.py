from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])
RECENT_ORDER_LIMIT = 5


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    total_orders = db.query(models.Order).count()

    status_counts = dict(
        db.query(models.Order.status, func.count(models.Order.order_id))
        .group_by(models.Order.status)
        .all()
    )

    recent_orders = (
        db.query(models.Order)
        .order_by(models.Order.created_at.desc())
        .limit(RECENT_ORDER_LIMIT)
        .all()
    )

    recent_ids = [order.order_id for order in recent_orders]

    # Counts for the recent orders are included here so the dashboard needs
    # one request, not one extra request per recent order.
    item_totals: dict[int, int] = {}
    box_type_counts: dict[int, int] = {}

    if recent_ids:
        item_totals = dict(
            db.query(
                models.OrderItem.order_id,
                func.sum(func.coalesce(models.OrderItem.Quantity, 1)),
            )
            .filter(models.OrderItem.order_id.in_(recent_ids))
            .group_by(models.OrderItem.order_id)
            .all()
        )
        box_type_counts = dict(
            db.query(models.OrderBoxType.order_id, func.count(models.OrderBoxType.Reference))
            .filter(models.OrderBoxType.order_id.in_(recent_ids))
            .group_by(models.OrderBoxType.order_id)
            .all()
        )

    return schemas.DashboardSummary(
        total_orders=total_orders,
        orders_by_status=status_counts,
        recent_orders=[
            schemas.DashboardRecentOrder(
                order_id=order.order_id,
                status=order.status,
                created_by=order.created_by,
                created_at=order.created_at,
                items_count=int(item_totals.get(order.order_id, 0)),
                boxes_count=box_type_counts.get(order.order_id, 0),
            )
            for order in recent_orders
        ],
    )