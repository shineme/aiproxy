from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ValueType(str, enum.Enum):
    STATIC = "static"
    JAVASCRIPT = "javascript"
    PYTHON = "python"


class HeaderConfig(Base):
    __tablename__ = "header_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    upstream_id = Column(Integer, ForeignKey("upstreams.id", ondelete="CASCADE"), nullable=False)
    
    header_name = Column(String(255), nullable=False)
    value_type = Column(SQLEnum(ValueType), default=ValueType.STATIC, nullable=False)
    
    static_value = Column(Text, nullable=True)
    script_content = Column(Text, nullable=True)
    
    priority = Column(Integer, default=0)
    timeout_ms = Column(Integer, default=1000)
    
    fallback_strategy = Column(String(50), default="use_default")
    fallback_value = Column(Text, nullable=True)
    
    is_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    upstream = relationship("Upstream", back_populates="header_configs")
