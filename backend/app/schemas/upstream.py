from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime


class UpstreamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    base_url: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = None
    proxy_path_prefix: str = "/proxy"
    timeout: int = Field(30, ge=1, le=300)
    retry_count: int = Field(1, ge=0, le=5)
    connection_pool_size: int = Field(10, ge=1, le=100)
    log_request_body: bool = False
    log_response_body: bool = False
    tags: List[str] = Field(default_factory=list)
    is_enabled: bool = True


class UpstreamCreate(UpstreamBase):
    pass


class UpstreamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    base_url: Optional[str] = Field(None, min_length=1, max_length=512)
    description: Optional[str] = None
    proxy_path_prefix: Optional[str] = None
    timeout: Optional[int] = Field(None, ge=1, le=300)
    retry_count: Optional[int] = Field(None, ge=0, le=5)
    connection_pool_size: Optional[int] = Field(None, ge=1, le=100)
    log_request_body: Optional[bool] = None
    log_response_body: Optional[bool] = None
    tags: Optional[List[str]] = None
    is_enabled: Optional[bool] = None


class UpstreamResponse(UpstreamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
