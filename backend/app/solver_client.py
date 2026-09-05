import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

SOLVER_BASE_URL = os.getenv("SOLVER_BASE_URL", "").rstrip("/")
SOLVER_TIMEOUT_SECONDS = 60.0

def submit_pack_request(payload: dict[str, Any]) -> httpx.Response:
    if not SOLVER_BASE_URL:
        raise RuntimeError("SOLVER_BASE_URL is not configured")

    url = f"{SOLVER_BASE_URL}/v1/pack"

    with httpx.Client(timeout = SOLVER_TIMEOUT_SECONDS) as client:
        return client.post(url, json = payload)