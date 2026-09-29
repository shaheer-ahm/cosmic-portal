from time import perf_counter

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import schemas
from app.auth import get_current_user
from app.database import get_db
from app.solver_client import check_solver_health

router = APIRouter(prefix="/api/v1/integration", tags=["integration"])


def _check_supabase_health(db: Session) -> dict:
    """Verify the backend can reach the Supabase Postgres database."""
    started = perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((perf_counter() - started) * 1000, 1)
        return {
            "configured": True,
            "connected": True,
            "latency_ms": latency_ms,
            "detail": "Supabase Postgres reachable",
        }
    except Exception as exc:
        latency_ms = round((perf_counter() - started) * 1000, 1)
        return {
            "configured": True,
            "connected": False,
            "latency_ms": latency_ms,
            "detail": f"Supabase database check failed: {exc.__class__.__name__}",
        }


@router.get("/status", response_model=schemas.IntegrationStatus)
def get_integration_status(
    db: Session = Depends(get_db), user: dict = Depends(get_current_user)
):
    """
    Return live health checks for FitSolver and Supabase.

    FitPortal API availability is established by successfully reaching this
    endpoint (and /health) from the frontend. FitVisualizer is a frontend
    package rather than a network service, so the frontend checks that the
    installed visualizer module can be loaded and exposes the expected API.
    """
    solver_status = check_solver_health()
    supabase_status = _check_supabase_health(db)
    return schemas.IntegrationStatus(
        solver=schemas.IntegrationComponentStatus(**solver_status),
        supabase=schemas.IntegrationComponentStatus(**supabase_status),
    )