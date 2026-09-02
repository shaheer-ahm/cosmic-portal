from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(String(50), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), primary_key=True)
    ItemCode = Column(String(50), primary_key=True)
    ItemReference = Column(String(255), nullable=False)
    Width = Column(Integer, nullable=False)
    Length = Column(Integer, nullable=False)
    Depth = Column(Integer, nullable=False)
    Weight = Column(Float, nullable=False)
    BoxGroup = Column(String(50), nullable=True)
    # Note: no Weight field yet

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


class Profile(Base):
    """
    One row per Supabase Auth user, linked by their auth UID.
    Auto-populated by the trigger in schema.sql whenever 
    someone signs up.
    """
    __tablename__ = "profiles"

    user_id = Column(UUID(as_uuid=False), primary_key=True)
    role = Column(String(20), nullable=False, default="USER")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())