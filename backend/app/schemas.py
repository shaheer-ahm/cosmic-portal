from typing import Optional
from pydantic import BaseModel

class ItemBase(BaseModel):
    ItemCode: str
    ItemReference: str
    Width: int
    Length: int
    Depth: int
    BoxGroup: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class OrderCreate(BaseModel):
    """Orders are created empty and items are added separately."""
    pass

class BoxTypeBase(BaseModel):
    Reference: str
    Width: float
    Length: float
    Depth: float
    MaxWeight: Optional[float] = None
    BoxWeight: Optional[float] = None
    Active: bool = True
    MaximumBoxes: Optional[int] = None
