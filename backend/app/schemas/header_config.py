from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.header_config import ValueType


class HeaderConfigBase(BaseModel):
    upstream_id: int
    header_name: str = Field(..., min_length=1, max_length=255)
    value_type: ValueType = ValueType.STATIC
    static_value: Optional[str] = None
    script_content: Optional[str] = None
    priority: int = 0
    timeout_ms: int = Field(1000, ge=100, le=5000)
    fallback_strategy: str = "use_default"
    fallback_value: Optional[str] = None
    is_enabled: bool = True


class HeaderConfigCreate(HeaderConfigBase):
    pass


class HeaderConfigUpdate(BaseModel):
    header_name: Optional[str] = Field(None, min_length=1, max_length=255)
    value_type: Optional[ValueType] = None
    static_value: Optional[str] = None
    script_content: Optional[str] = None
    priority: Optional[int] = None
    timeout_ms: Optional[int] = Field(None, ge=100, le=5000)
    fallback_strategy: Optional[str] = None
    fallback_value: Optional[str] = None
    is_enabled: Optional[bool] = None


class HeaderConfigResponse(HeaderConfigBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
