from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Upstream(Base):
    __tablename__ = "upstreams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    base_url = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    
    proxy_path_prefix = Column(String(255), default="/proxy")
    timeout = Column(Integer, default=30)
    retry_count = Column(Integer, default=1)
    connection_pool_size = Column(Integer, default=10)
    
    log_request_body = Column(Boolean, default=False)
    log_response_body = Column(Boolean, default=False)
    
    tags = Column(JSON, default=list)
    
    is_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    api_keys = relationship("APIKey", back_populates="upstream", cascade="all, delete-orphan")
    header_configs = relationship("HeaderConfig", back_populates="upstream", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="upstream", cascade="all, delete-orphan")
    request_logs = relationship("RequestLog", back_populates="upstream", cascade="all, delete-orphan")
