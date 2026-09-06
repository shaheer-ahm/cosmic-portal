import os

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status

from app import schemas
from app.auth import get_current_user

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest):
    """
    Authenticates a user and returns a JWT access token.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500, detail="Supabase auth is not configured on the server"
        )

    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token",
        params={"grant_type": "password"},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        json={"email": credentials.email, "password": credentials.password},
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    data = resp.json()
    return schemas.LoginResponse(
        access_token=data["access_token"],
        token_type=data.get("token_type", "bearer"),
        expires_in=data.get("expires_in"),
    )

@router.get("/me", response_model=schemas.CurrentUserOut)
def get_current_user_info(user: dict = Depends(get_current_user)):
    return schemas.CurrentUserOut(**user)
