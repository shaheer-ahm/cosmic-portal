from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/box-types", tags=["box-types"])


@router.get("/", response_model=list[schemas.BoxTypeOut])
def list_box_types(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(models.BoxType).filter(models.BoxType.Active.is_(True)).all()