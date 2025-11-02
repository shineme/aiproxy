from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.request_log import RequestLog


class RequestLogger:
    """请求日志记录器"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def log_request(
        self,
        upstream_id: int,
        api_key_id: Optional[int],
        method: str,
        path: str,
        request_headers: Optional[Dict[str, Any]] = None,
        request_body: Optional[str] = None,
        status_code: Optional[int] = None,
        response_headers: Optional[Dict[str, Any]] = None,
        response_body: Optional[str] = None,
        latency_ms: Optional[int] = None,
        client_ip: Optional[str] = None,
        error_message: Optional[str] = None,
        triggered_rules: Optional[List[int]] = None
    ) -> RequestLog:
        """
        记录请求日志
        
        Args:
            upstream_id: 上游API ID
            api_key_id: 使用的API密钥ID
            method: HTTP方法
            path: 请求路径
            request_headers: 请求头
            request_body: 请求体
            status_code: HTTP状态码
            response_headers: 响应头
            response_body: 响应体
            latency_ms: 延迟时间（毫秒）
            client_ip: 客户端IP
            error_message: 错误信息
            triggered_rules: 触发的规则ID列表
        
        Returns:
            创建的日志记录
        """
        log = RequestLog(
            upstream_id=upstream_id,
            api_key_id=api_key_id,
            method=method,
            path=path,
            request_headers=request_headers,
            request_body=request_body,
            status_code=status_code,
            response_headers=response_headers,
            response_body=response_body,
            latency_ms=latency_ms,
            client_ip=client_ip,
            error_message=error_message,
            triggered_rules=triggered_rules or []
        )
        
        self.db.add(log)
        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(log)
        
        return log
