from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class RequestLogResponse(BaseModel):
    id: int
    upstream_id: int
    api_key_id: Optional[int] = None
    method: str
    path: str
    request_headers: Optional[Dict[str, Any]] = None
    request_body: Optional[str] = None
    status_code: Optional[int] = None
    response_headers: Optional[Dict[str, Any]] = None
    response_body: Optional[str] = None
    latency_ms: Optional[int] = None
    client_ip: Optional[str] = None
    error_message: Optional[str] = None
    triggered_rules: List[int] = []
    created_at: datetime
    
    class Config:
        from_attributes = True
