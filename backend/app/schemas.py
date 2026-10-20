from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator




class ItemBase(BaseModel):
    ItemCode: str = Field(min_length = 1, max_length = 50)
    ItemReference: str = Field(min_length = 1, max_length = 255)
    Width: int = Field(gt = 0)
    Length: int = Field(gt = 0)
    Depth: int = Field(gt = 0)
    BoxGroup: Optional[str] = Field(default = None, max_length = 50)
    Weight: float = Field(gt = 0)
    Quantity: Optional[int] = Field(default = None, ge = 1)
    KeepUpright: Optional[bool] = None
    Fragile: bool = False

    @field_validator("ItemCode", "ItemReference")
    @classmethod
    def required_text_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("BoxGroup")
    @classmethod
    def normalise_optional_box_group(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ItemCreate(ItemBase):
    pass

class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    """Orders are created empty and items are added separately."""
    pass


class BulkOrderDeleteRequest(BaseModel):
    order_ids: list[int] = Field(min_length = 1, max_length = 200)

    @field_validator("order_ids")
    @classmethod
    def validate_order_ids(cls, values: list[int]) -> list[int]:
        if any(order_id <= 0 for order_id in values):
            raise ValueError("Order IDs must be positive integers")

        return list(dict.fromkeys(values))


class BulkOrderDeleteResponse(BaseModel):
    deleted_order_ids: list[int]
    deleted_count: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    order_id: int
    status: str
    created_by: Optional[str] = None
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

class BoxTypeCreate(BaseModel):
    """Body for POST /box-types."""
    Reference: str = Field(min_length=1, max_length=50)
    Width: float = Field(gt=0)
    Length: float = Field(gt=0)
    Depth: float = Field(gt=0)
    MaxWeight: Optional[float] = Field(default=None, gt=0)
    BoxWeight: Optional[float] = Field(default=None, ge=0)
    MaximumBoxes: Optional[int] = Field(default=None, ge=1)

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
    Fragile: bool = False

class SolverCenterOfGravity(BaseModel):
    X: float
    Y: float
    Z: float

class SolverBox(BaseModel):
    BoxIndex: int
    Reference: str
    BoxGroup: Optional[str] = None
    Dimensions: SolverDimensions
    CentreOfGravity: Optional[SolverCenterOfGravity] = None
    Balanced: Optional[bool] = None
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

class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+$")
    redirect_to: Optional[str] = Field(default=None, max_length=2048)

class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=1, max_length=72)

class MessageResponse(BaseModel):
    message: str

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
