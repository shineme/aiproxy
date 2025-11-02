from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class RuleAction(str, enum.Enum):
    DISABLE_KEY = "disable_key"
    BAN_KEY = "ban_key"
    ALERT = "alert"
    LOG = "log"


class Rule(Base):
    __tablename__ = "rules"
    
    id = Column(Integer, primary_key=True, index=True)
    upstream_id = Column(Integer, ForeignKey("upstreams.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    conditions = Column(JSON, nullable=False)
    
    actions = Column(JSON, nullable=False)
    
    auto_enable_delay_hours = Column(Integer, nullable=True)
    
    trigger_threshold = Column(Integer, default=1)
    time_window_seconds = Column(Integer, nullable=True)
    cooldown_seconds = Column(Integer, default=0)
    
    priority = Column(Integer, default=0)
    is_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    upstream = relationship("Upstream", back_populates="rules")
