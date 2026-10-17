import os
import uuid
from time import perf_counter
from typing import Any, Optional
 
import httpx
from dotenv import load_dotenv
 
from app import models, schemas

load_dotenv()

SOLVER_URL = (os.getenv("SOLVER_URL") or "").rstrip("/")
# TODO: SOLVER_API_KEY = os.getenv("SOLVER_API_KEY")

SOLVER_TIMEOUT_SECONDS = 55.0
SOLVER_HEALTH_TIMEOUT_SECONDS = 15.0


class SolverError(Exception):
    """Raised when FitSolver is unreachable, times out, or returns a real
    error."""


def _item_payload(item: "models.OrderItem") -> dict[str, Any]:
    payload: dict[str, Any] = {
        "ItemCode": item.ItemCode,
        "ItemReference": item.ItemReference,
        "Width": item.Width,
        "Length": item.Length,
        "Depth": item.Depth,
        "Weight": item.Weight,
        "Fragile": item.Fragile,
    }
    if item.BoxGroup is not None:
        payload["BoxGroup"] = item.BoxGroup
    if item.Quantity is not None:
        payload["Quantity"] = item.Quantity
    if item.KeepUpright is not None:
        payload["KeepUpright"] = item.KeepUpright
    return payload


def _box_type_payload(box: "models.BoxType") -> dict[str, Any]:
    payload = {
        "Reference": box.Reference,
        "Width": box.Width,
        "Length": box.Length,
        "Depth": box.Depth,
        "Active": box.Active,
    }

    optional_fields = {
        "MaxWeight": box.MaxWeight,
        "BoxWeight": box.BoxWeight,
        "MaximumBoxes": box.MaximumBoxes,
    }

    for field, value in optional_fields.items():
        if value is not None:
            payload[field] = value

    return payload


def call_solver(
    items: list["models.OrderItem"],
    box_types: list["models.BoxType"],
    request_id: Optional[str] = None,
) -> "schemas.SolverResult":
    """
    Calls FitSolver's POST /v1/pack with the order's items and
    selected box types.
    
    Raises SolverError on network failure, timeout, non-200 response, 
    or a response that doesn't match the expected shape.
    """
    if not SOLVER_URL:
        raise SolverError("SOLVER_URL is not configured")

    request_id = request_id or str(uuid.uuid4())

    payload = {
        "Boxes": [_box_type_payload(b) for b in box_types],
        "Items": [_item_payload(i) for i in items],
        "RequestId": request_id,
    }

    headers = {"Content-Type": "application/json"}
    # TODO: headers["X-API-Key"] = SOLVER_API_KEY

    try:
        resp = httpx.post(
            f"{SOLVER_URL}/v1/pack",
            json=payload,
            headers=headers,
            timeout=SOLVER_TIMEOUT_SECONDS,
        )
    except httpx.RequestError as exc:
        raise SolverError(f"Could not reach FitSolver: {exc}") from exc

    if resp.status_code != 200:
        try:
            detail = resp.json()
        except ValueError:
            detail = resp.text
        raise SolverError(f"FitSolver returned {resp.status_code}: {detail}")

    try:
        return schemas.SolverResult.model_validate(resp.json())
    except Exception as exc:  # pydantic.ValidationError, primarily
        raise SolverError(f"FitSolver response didn't match expected schema: {exc}") from exc


def check_solver_health() -> dict[str, Any]:
    """Ping FitSolver's GET /health and report real connectivity/latency."""
    if not SOLVER_URL:
        return {
            "configured": False,
            "connected": False,
            "latency_ms": None,
            "detail": "SOLVER_URL is not configured",
        }

    started = perf_counter()
    try:
        resp = httpx.get(
            f"{SOLVER_URL}/health",
            timeout=SOLVER_HEALTH_TIMEOUT_SECONDS,
        )
        latency_ms = round((perf_counter() - started) * 1000, 1)
    except httpx.RequestError as exc:
        latency_ms = round((perf_counter() - started) * 1000, 1)
        return {
            "configured": True,
            "connected": False,
            "latency_ms": latency_ms,
            "detail": f"FitSolver unreachable: {exc.__class__.__name__}",
        }

    if 200 <= resp.status_code < 300:
        return {
            "configured": True,
            "connected": True,
            "latency_ms": latency_ms,
            "detail": "FitSolver reachable",
        }

    return {
        "configured": True,
        "connected": False,
        "latency_ms": latency_ms,
        "detail": f"FitSolver returned HTTP {resp.status_code} on /health",
    }