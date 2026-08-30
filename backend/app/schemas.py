from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ItemBase(BaseModel):
    ItemCode: str
    ItemReference: str
    Width: int
    Length: int
    Depth: int
    BoxGroup: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    """Orders are created empty and items are added separately."""
    pass

class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    order_id: int
    status: str
    created_at: datetime

class OrderWithItemsOut(OrderOut):
    items: list[ItemOut] = []

class BoxTypeBase(BaseModel):
    Reference: str
    Width: float
    Length: float
    Depth: float
    MaxWeight: Optional[float] = None
    BoxWeight: Optional[float] = None
    Active: bool = True
    MaximumBoxes: Optional[int] = None

class BoxTypeOut(BoxTypeBase):
    model_config = ConfigDict(from_attributes=True)