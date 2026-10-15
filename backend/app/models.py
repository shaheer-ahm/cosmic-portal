from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(String(50), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    box_types = relationship("OrderBoxType", back_populates="order", cascade="all, delete-orphan")
    result = relationship("OrderResult", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), primary_key=True)
    ItemCode = Column(String(50), primary_key=True)
    ItemReference = Column(String(255), nullable=False)
    Width = Column(Integer, nullable=False)
    Length = Column(Integer, nullable=False)
    Depth = Column(Integer, nullable=False)
    BoxGroup = Column(String(50), nullable=True)
    Weight = Column(Float, nullable=False)
    Quantity = Column(Integer, nullable=True)
    KeepUpright = Column(Boolean, nullable=True)
    
    Fragile = Column(Boolean, nullable=False, default=False)


    __table_args__ = (CheckConstraint("\"Weight\" >= 0", name="order_items_weight_non_negative"),)

    order = relationship("Order", back_populates="items")


class BoxType(Base):
    __tablename__ = "box_types"

    Reference = Column(String(50), primary_key=True)
    Width = Column(Float, nullable=False)
    Length = Column(Float, nullable=False)
    Depth = Column(Float, nullable=False)
    MaxWeight = Column(Float, nullable=True)
    BoxWeight = Column(Float, nullable=True)
    Active = Column(Boolean, nullable=False, default=True)
    MaximumBoxes = Column(Integer, nullable=True)

    order_selections = relationship("OrderBoxType", back_populates = "box_type")

class OrderBoxType(Base):
    """
    Association between an order and the box types that may be used to
    pack it. Populated via POST /api/v1/orders/{order_id}/box-types.
    """
    __tablename__ = "order_box_types"

    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), primary_key=True)
    Reference = Column(String(50), ForeignKey("box_types.Reference"), primary_key=True)

    order = relationship("Order", back_populates="box_types")
    box_type = relationship("BoxType")


class OrderResult(Base):
    """
    Optimisation output for an order, produced by FitSolver.
    """
    __tablename__ = "order_results"

    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), primary_key=True)
    result_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    order = relationship("Order", back_populates="result")


class Profile(Base):
    """
    One row per Supabase Auth user, linked by their auth UID.
    Auto-populated by the trigger in schema.sql whenever 
    someone signs up.
    """
    __tablename__ = "profiles"

    user_id = Column(UUID(as_uuid=False), primary_key=True)
    email = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="USER")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
