from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field




class ItemBase(BaseModel):
    ItemCode: str
    ItemReference: str
    Width: int
    Length: int
    Depth: int
    BoxGroup: Optional[str] = None
    Weight: float = Field(ge=0)
    Quantity: Optional[int] = None
    KeepUpright: Optional[bool] = None
    Fragile: bool = False



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

class OrderSummaryOut(OrderOut):
    items_count: int
    boxes_count: int

class OrderWithItemsOut(OrderOut):
    items: list[ItemOut] = []
    box_types: list[str] = []

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

# Order box-type selection

class BoxTypeSelectionIn(BaseModel):
    """Body for POST /orders/{order_id}/box-types. Replaces the order's
    current box-type selection with this list."""
    references: list[str]


# Order validation

class ValidationIssue(BaseModel):
    field: Optional[str] = None
    message: str

class ValidateResponse(BaseModel):
    valid: bool
    status: str
    issues: list[ValidationIssue] = []


# Order status

class OrderStatusOut(BaseModel):
    order_id: int
    status: str


# Optimisation

class OptimiseResponse(BaseModel):
    order_id: int
    status: str
    message: str


# FitSolver response schema
class SolverUnits(BaseModel):
    Length: str
    Weight: str

class SolverCoordinateSystem(BaseModel):
    Origin: str
    X: str
    Y: str
    Z: str
    PositionMeaning: str

class SolverMeta(BaseModel):
    Engine: str
    Version: str
    SchemaVersion: str
    SolveTimeMs: float
    TimeLimitReached: bool
    Units: SolverUnits
    CoordinateSystem: SolverCoordinateSystem
    RequestId: Optional[str] = None

class SolverSummary(BaseModel):
    BoxCount: int
    BoxCounts: dict[str, int]
    PackedItemCount: int
    UnpackedItemCount: int
    TotalWeight: float
    OverallVolumeUtilisation: float

class SolverAxisMap(BaseModel):
    X: str
    Y: str
    Z: str

class SolverRotationDegrees(BaseModel):
    X: int
    Y: int
    Z: int

class SolverOrientation(BaseModel):
    Code: str
    AxisMap: SolverAxisMap
    RotationDegrees: SolverRotationDegrees

class SolverPosition(BaseModel):
    X: float
    Y: float
    Z: float

class SolverDimensions(BaseModel):
    Width: float
    Length: float
    Depth: float

class SolverPlacedItem(BaseModel):
    Sequence: int
    InstanceId: str
    ItemCode: str
    ItemReference: str
    BoxGroup: Optional[str] = None
    Position: SolverPosition
    Dimensions: SolverDimensions
    Orientation: SolverOrientation
    Weight: Optional[float] = None

class SolverBox(BaseModel):
    BoxIndex: int
    Reference: str
    BoxGroup: Optional[str] = None
    Dimensions: SolverDimensions
    ItemCount: int
    ItemsWeight: float
    BoxWeight: float
    TotalWeight: float
    MaxWeight: Optional[float] = None
    VolumeUtilisation: float
    LoadHeight: float
    Items: list[SolverPlacedItem]

class SolverUnpackedItem(BaseModel):
    InstanceId: str
    ItemCode: str
    ItemReference: Optional[str] = None
    ReasonCode: str
    Reason: str

class SolverResult(BaseModel):
    """The full body of a FitSolver POST /v1/pack response."""
    Success: bool
    Meta: SolverMeta
    Summary: SolverSummary
    Boxes: list[SolverBox]
    UnpackedItems: list[SolverUnpackedItem] = []


# Results

class OrderResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    result_data: SolverResult
    created_at: datetime


# Dashboard

class DashboardSummary(BaseModel):
    total_orders: int
    orders_by_status: dict[str, int]
    recent_orders: list[OrderOut]


# Integration status

class IntegrationComponentStatus(BaseModel):
    configured: bool
    connected: bool
    detail: str
    latency_ms: Optional[float] = None

class IntegrationStatus(BaseModel):
    solver: IntegrationComponentStatus
    supabase: IntegrationComponentStatus


# Auth

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None

class CurrentUserOut(BaseModel):
    user_id: str
    email: Optional[str] = None
    role: str

    
# Users / roles

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: Optional[str] = None
    role: str
    created_at: datetime

class RoleUpdate(BaseModel):
    role: Literal["USER", "SUPERVISOR"]
