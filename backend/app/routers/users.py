import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_supervisor
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/", response_model=list[schemas.ProfileOut])
def list_users(db: Session = Depends(get_db), user: dict = Depends(require_supervisor)):
    """
    List every user with their email and role. SUPERVISOR only.
    """
    return db.query(models.Profile).order_by(models.Profile.created_at).all()


@router.put("/{user_id}/role", response_model=schemas.ProfileOut)
def update_user_role(
    user_id: uuid.UUID,
    body: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Set a user's role to USER or SUPERVISOR. SUPERVISOR only.
    A supervisor cannot change their own role.
    """
    target_id = str(user_id)

    if target_id == str(current_user["user_id"]).lower():
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    profile = db.query(models.Profile).filter(models.Profile.user_id == target_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"No user found with id '{target_id}'")

    old_role = profile.role
    profile.role = body.role
    db.commit()
    db.refresh(profile)

    logger.info(
        "role change: user=%s %s -> %s (by supervisor=%s)",
        target_id, old_role, body.role, current_user["user_id"],
    )
    return profile
