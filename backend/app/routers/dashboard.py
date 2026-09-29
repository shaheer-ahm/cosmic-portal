from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


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
        .limit(5)
        .all()
    )

    return schemas.DashboardSummary(
        total_orders=total_orders,
        orders_by_status=status_counts,
        recent_orders=recent_orders,
    )