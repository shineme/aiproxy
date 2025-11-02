from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class RequestLog(Base):
    __tablename__ = "request_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    upstream_id = Column(Integer, ForeignKey("upstreams.id", ondelete="CASCADE"), nullable=False)
    api_key_id = Column(Integer, ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True)
    
    method = Column(String(10), nullable=False)
    path = Column(String(1024), nullable=False)
    
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    
    status_code = Column(Integer, nullable=True)
    response_headers = Column(JSON, nullable=True)
    response_body = Column(Text, nullable=True)
    
    latency_ms = Column(Integer, nullable=True)
    
    client_ip = Column(String(45), nullable=True)
    
    error_message = Column(Text, nullable=True)
    
    triggered_rules = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    upstream = relationship("Upstream", back_populates="request_logs")
    api_key = relationship("APIKey", back_populates="request_logs")
