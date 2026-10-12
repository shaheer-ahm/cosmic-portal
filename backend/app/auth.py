import logging
import os

import jwt
from jwt import PyJWKClient
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import SessionLocal
from app import models

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")

# Supabase signs access tokens with ES256. Only ES256 is accepted
_jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json") if SUPABASE_URL else None

bearer_scheme = HTTPBearer()

def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verifies the bearer token's signature, audience and expiry, then looks up
    the user's role from the profiles table.

    Returns: {"user_id": <uuid str>, "email": <str>, "role": "USER"|"SUPERVISOR"}
    """
    token = credentials.credentials

    try:
        alg = jwt.get_unverified_header(token).get("alg")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid token")

    if alg != "ES256":
        raise _unauthorized("Invalid token")

    if not _jwks_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL is not configured - cannot verify tokens",
        )

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            options={"require": ["exp", "aud", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Token expired")
    except jwt.PyJWTError as exc:
        # Detail goes to the server log
        logger.warning("JWT rejected: %s", exc)
        raise _unauthorized("Invalid token")

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id:
        raise _unauthorized("Invalid token")

    db = SessionLocal()
    try:
        profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    finally:
        db.close()

    # Token is valid but no profile row exists yet: least privilege.
    role = profile.role if profile else "USER"

    return {"user_id": user_id, "email": email, "role": role}


def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    """
    Use as a dependency on routes that only SUPERVISORs may access.
    """
    if user["role"] != "SUPERVISOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPERVISOR users may perform this action",
        )
    return user