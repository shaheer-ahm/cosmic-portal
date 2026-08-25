from fastapi import APIRouter, Depends
from app.database import get_db

router = APIRouter(
    prefix="/api/v1/box-types",
    tags=["box-types"]
)

def _normalise(row: dict) -> dict:
    """Convert Active from MySQL 0/1 to Python True/False."""
    if row is not None and "Active" in row:
        row["Active"] = bool(row["Active"])
    return row


@router.get("/")
def list_box_types(db=Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM box_types WHERE Active = TRUE"
        )
        rows = cursor.fetchall()

    return [_normalise(row) for row in rows]