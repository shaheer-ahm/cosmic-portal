import logging
import uuid

import os
import httpx
from fastapi import status


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

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    target_id = str(user_id)

    # Supervisors cannot delete themselves.
    if target_id == str(current_user["user_id"]).lower():
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account.",
        )

    profile = (
        db.query(models.Profile)
        .filter(models.Profile.user_id == target_id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="User profile not found.",
        )

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    
    service_key = os.getenv("SUPABASE_SECRET_KEY", "")


    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=503,
            detail="Supabase Admin API is not configured.",
        )

    try:
        response = httpx.delete(
            f"{supabase_url}/auth/v1/admin/users/{target_id}",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
            },
            timeout=15.0,
        )
    except httpx.RequestError:
        logger.exception("Supabase user deletion request failed")
        raise HTTPException(
            status_code=502,
            detail="Could not contact Supabase Auth.",
        )

    if response.status_code not in (200, 204):
        logger.error(
            "Supabase deletion failed for user %s: %s",
            target_id,
            response.status_code,
        )
        raise HTTPException(
            status_code=502,
            detail="Supabase Auth refused the deletion.",
        )

    # Supabase auth.users -> public.profiles uses ON DELETE CASCADE.
    # The database should remove the profile automatically.
    # Existing orders use ON DELETE SET NULL for created_by.
    logger.info(
        "user deleted: user=%s by supervisor=%s",
        target_id,
        current_user["user_id"],
    )
