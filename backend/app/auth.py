import os
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import SessionLocal
from app import models

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verifies the bearer token's signature and expiry, then looks up the
    user's role from the profiles table.

    Returns: {"user_id": <uuid str>, "email": <str>, "role": "USER"|"SUPERVISOR"}
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")

    db = SessionLocal()
    try:
        profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    finally:
        db.close()

    # Token is valid but no profile row exists yet, default to least-privileged.
    role = profile.role if profile else "USER"

    return {"user_id": user_id, "email": email, "role": role}


def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    """
    Use as a dependency on routes that only SUPERVISORs may access.

    NOTE: role enforcement is disabled in the API for now.
    """
    if user["role"] != "SUPERVISOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPERVISOR users may perform this action",
        )
    return user