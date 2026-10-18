import logging
import os
import re
from urllib.parse import urlsplit

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import schemas
from app.auth import get_current_user

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

SUPABASE_TIMEOUT_SECONDS = 15.0

# Same origins the API trusts for CORS. Password-reset links may only
# send users back to one of these.
ALLOWED_ORIGINS = {
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5174",
    ).split(",")
    if origin.strip()
}

# Explicit reset page URL
# Used when the client does not send redirect_to, or sends one we don't trust
PASSWORD_RESET_REDIRECT_URL = "https://cosmic-portal-frontend.onrender.com/reset-password"

FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for that email, a password reset link has been sent."
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_optional_bearer = HTTPBearer(auto_error=False)

def _require_supabase_config() -> None:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500, detail="Supabase auth is not configured on the server"
        )


def _supabase_error_message(resp: httpx.Response) -> str | None:
    """Pull the human-readable message out of a Supabase Auth error body."""
    try:
        body = resp.json()
    except ValueError:
        return None
    if not isinstance(body, dict):
        return None
    for key in ("msg", "message", "error_description", "error"):
        value = body.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def password_policy_error(password: str) -> str | None:
    """Same rule the sign-up form enforces: 8+ characters, at least one digit."""
    if len(password) < 8 or not re.search(r"\d", password):
        return "Password must be at least 8 characters long and contain at least one number."
    return None


def safe_redirect_url(requested: str | None) -> str | None:
    """
    Only allow reset links to point at a trusted frontend origin, so the
    endpoint can't be abused to send users' recovery tokens to another site.
    Supabase also checks against its own Redirect URLs allow-list.
    """
    if requested:
        parts = urlsplit(requested)
        origin = f"{parts.scheme}://{parts.netloc}"
        if parts.scheme in ("http", "https") and origin in ALLOWED_ORIGINS:
            return requested
        logger.warning("Rejected untrusted password reset redirect: %s", requested)
    return PASSWORD_RESET_REDIRECT_URL

@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest):
    """
    Authenticates a user and returns a JWT access token.
    """

    _require_supabase_config()

    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token",
        params={"grant_type": "password"},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": credentials.email, "password": credentials.password},
        timeout=SUPABASE_TIMEOUT_SECONDS,
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    data = resp.json()
    return schemas.LoginResponse(
        access_token=data["access_token"],
        token_type=data.get("token_type", "bearer"),
        expires_in=data.get("expires_in"),
    )

@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(body: schemas.ForgotPasswordRequest):
    """
    Emails the user a password reset link via Supabase Auth.
    """
    _require_supabase_config()

    params = {}
    redirect_to = safe_redirect_url(body.redirect_to)
    if redirect_to:
        params["redirect_to"] = redirect_to

    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/auth/v1/recover",
            params=params,
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": body.email.strip()},
            timeout=SUPABASE_TIMEOUT_SECONDS,
        )
    except httpx.RequestError as exc:
        logger.error("Password reset request could not reach Supabase: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the reset email right now. Please try again later.",
        )

    if resp.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset requests. Please wait a few minutes and try again.",
        )

    if resp.status_code >= 500:
        logger.error(
            "Supabase /recover failed (%s): %s",
            resp.status_code,
            _supabase_error_message(resp),
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the reset email right now. Please try again later.",
        )

    if resp.status_code >= 400:
        # e.g. malformed email
        logger.info(
            "Supabase /recover rejected request (%s): %s",
            resp.status_code,
            _supabase_error_message(resp),
        )

    return schemas.MessageResponse(message=FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(
    body: schemas.ResetPasswordRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
):
    """
    Sets a new password for the user identified by the bearer token.
    """
    _require_supabase_config()

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your reset link is invalid or has expired. Please request a new one.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    policy_error = password_policy_error(body.new_password)
    if policy_error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=policy_error)

    try:
        resp = httpx.put(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {credentials.credentials}",
                "Content-Type": "application/json",
            },
            json={"password": body.new_password},
            timeout=SUPABASE_TIMEOUT_SECONDS,
        )
    except httpx.RequestError as exc:
        logger.error("Password update could not reach Supabase: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not update your password right now. Please try again later.",
        )

    if resp.status_code == 200:
        return schemas.MessageResponse(message="Your password has been updated.")

    if resp.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your reset link is invalid or has expired. Please request a new one.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if resp.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a few minutes and try again.",
        )

    if 400 <= resp.status_code < 500:
        # Supabase's own password rules, e.g. "New password should be
        # different from the old password."
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=_supabase_error_message(resp) or "That password can't be used. Try another.",
        )

    logger.error(
        "Supabase password update failed (%s): %s",
        resp.status_code,
        _supabase_error_message(resp),
    )
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Could not update your password right now. Please try again later.",
    )

@router.get("/me", response_model=schemas.CurrentUserOut)
def get_current_user_info(user: dict = Depends(get_current_user)):
    return schemas.CurrentUserOut(**user)