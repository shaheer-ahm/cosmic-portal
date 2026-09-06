from fastapi import APIRouter

from app import schemas
from app.solver_client import check_solver_health

router = APIRouter(prefix="/api/v1/integration", tags=["integration"])


@router.get("/status", response_model=schemas.IntegrationStatus)
def get_integration_status():
    """
    Reports live integration status.

    Solver: performs a real GET /health check against FitSolver's deployed
    URL

    Visualizer: still unconfigured - no live endpoint to check yet
    """
    solver_status = check_solver_health()

    return schemas.IntegrationStatus(
        solver=schemas.IntegrationComponentStatus(**solver_status),
        visualizer=schemas.IntegrationComponentStatus(
            configured=False,
            detail=(
                "Integration approach and auth scheme (JWT vs. service-level) "
                "not yet confirmed with the Visualizer team"
            ),
        ),
    )
