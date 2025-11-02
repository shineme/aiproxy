from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class RuleBase(BaseModel):
    upstream_id: int
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    conditions: Dict[str, Any]
    actions: List[str]
    auto_enable_delay_hours: Optional[int] = Field(None, ge=0)
    trigger_threshold: int = Field(1, ge=1)
    time_window_seconds: Optional[int] = Field(None, ge=1)
    cooldown_seconds: int = Field(0, ge=0)
    priority: int = 0
    is_enabled: bool = True


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[List[str]] = None
    auto_enable_delay_hours: Optional[int] = Field(None, ge=0)
    trigger_threshold: Optional[int] = Field(None, ge=1)
    time_window_seconds: Optional[int] = Field(None, ge=1)
    cooldown_seconds: Optional[int] = Field(None, ge=0)
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None


class RuleResponse(RuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
