from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.api_key import KeyStatus, KeyLocation


class APIKeyBase(BaseModel):
    upstream_id: int
    name: Optional[str] = None
    key_value: str = Field(..., min_length=1)
    location: KeyLocation = KeyLocation.HEADER
    param_name: str = "Authorization"
    value_prefix: Optional[str] = "Bearer "
    enable_quota: bool = False
    quota_total: Optional[int] = Field(None, ge=0)
    auto_disable_on_failure: bool = True
    auto_enable_delay_hours: Optional[int] = Field(None, ge=0)


class APIKeyCreate(APIKeyBase):
    pass


class APIKeyUpdate(BaseModel):
    name: Optional[str] = None
    key_value: Optional[str] = Field(None, min_length=1)
    location: Optional[KeyLocation] = None
    param_name: Optional[str] = None
    value_prefix: Optional[str] = None
    status: Optional[KeyStatus] = None
    enable_quota: Optional[bool] = None
    quota_total: Optional[int] = Field(None, ge=0)
    quota_used: Optional[int] = Field(None, ge=0)
    auto_disable_on_failure: Optional[bool] = None
    auto_enable_delay_hours: Optional[int] = Field(None, ge=0)


class APIKeyResponse(APIKeyBase):
    id: int
    status: KeyStatus
    quota_used: int
    quota_reset_at: Optional[datetime] = None
    auto_enable_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
