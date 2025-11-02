from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class KeyStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    BANNED = "banned"


class KeyLocation(str, enum.Enum):
    HEADER = "header"
    QUERY = "query"
    BODY = "body"


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    upstream_id = Column(Integer, ForeignKey("upstreams.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=True)
    key_value = Column(Text, nullable=False)
    
    location = Column(SQLEnum(KeyLocation), default=KeyLocation.HEADER, nullable=False)
    param_name = Column(String(255), default="Authorization", nullable=False)
    value_prefix = Column(String(50), default="Bearer ", nullable=True)
    
    status = Column(SQLEnum(KeyStatus), default=KeyStatus.ACTIVE, nullable=False, index=True)
    
    enable_quota = Column(Boolean, default=False)
    quota_total = Column(Integer, nullable=True)
    quota_used = Column(Integer, default=0)
    quota_reset_at = Column(DateTime(timezone=True), nullable=True)
    
    auto_disable_on_failure = Column(Boolean, default=True)
    auto_enable_delay_hours = Column(Integer, nullable=True)
    auto_enable_at = Column(DateTime(timezone=True), nullable=True)
    
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    upstream = relationship("Upstream", back_populates="api_keys")
    request_logs = relationship("RequestLog", back_populates="api_key", cascade="all, delete-orphan")
