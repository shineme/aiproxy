from typing import Dict, Any, Optional
import httpx
import time
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.upstream import Upstream
from app.models.api_key import APIKey, KeyLocation
from app.services.key_selector import KeySelector
from app.services.rule_engine import RuleEngine, ProxyResponse
from app.services.logger import RequestLogger


class ProxyService:
    """HTTP代理服务 - 负责请求转发和处理"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.key_selector = KeySelector(db)
        self.rule_engine = RuleEngine(db)
        self.logger = RequestLogger(db)
    
    async def forward_request(
        self,
        upstream: Upstream,
        method: str,
        path: str,
        headers: Dict[str, str],
        body: Optional[bytes],
        client_ip: str
    ) -> ProxyResponse:
        """
        转发HTTP请求到上游API
        
        Args:
            upstream: 上游API配置
            method: HTTP方法
            path: 请求路径
            headers: 请求头
            body: 请求体
            client_ip: 客户端IP
        
        Returns:
            代理响应对象
        """
        api_key = await self.key_selector.select_key(upstream.id)
        
        if not api_key:
            raise Exception("没有可用的API密钥")
        
        full_url = f"{upstream.base_url.rstrip('/')}/{path.lstrip('/')}"
        
        modified_headers = self._prepare_headers(headers, api_key)
        
        start_time = time.time()
        
        try:
            response = await self._make_request(
                method=method,
                url=full_url,
                headers=modified_headers,
                body=body,
                timeout=upstream.timeout,
                retry_count=upstream.retry_count
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            proxy_response = ProxyResponse(
                status_code=response.status_code,
                headers=dict(response.headers),
                body=response.text,
                latency_ms=latency_ms
            )
            
            await self.key_selector.increment_usage(api_key.id)
            
            triggered_rules = await self.rule_engine.evaluate_rules(
                upstream.id,
                api_key.id,
                proxy_response
            )
            
            await self.logger.log_request(
                upstream_id=upstream.id,
                api_key_id=api_key.id,
                method=method,
                path=path,
                request_headers=headers if upstream.log_request_body else None,
                request_body=body.decode() if body and upstream.log_request_body else None,
                status_code=response.status_code,
                response_headers=dict(response.headers) if upstream.log_response_body else None,
                response_body=response.text if upstream.log_response_body else None,
                latency_ms=latency_ms,
                client_ip=client_ip,
                triggered_rules=triggered_rules
            )
            
            return proxy_response
            
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            
            await self.logger.log_request(
                upstream_id=upstream.id,
                api_key_id=api_key.id,
                method=method,
                path=path,
                request_headers=headers,
                request_body=body.decode() if body else None,
                status_code=None,
                response_headers=None,
                response_body=None,
                latency_ms=latency_ms,
                client_ip=client_ip,
                error_message=str(e),
                triggered_rules=[]
            )
            
            raise
    
    def _prepare_headers(
        self,
        original_headers: Dict[str, str],
        api_key: APIKey
    ) -> Dict[str, str]:
        """准备请求头（添加API密钥）"""
        headers = original_headers.copy()
        
        if api_key.location == KeyLocation.HEADER:
            key_value = f"{api_key.value_prefix or ''}{api_key.key_value}"
            headers[api_key.param_name] = key_value
        
        headers.pop("host", None)
        
        return headers
    
    async def _make_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        body: Optional[bytes],
        timeout: int,
        retry_count: int
    ) -> httpx.Response:
        """发送HTTP请求（支持重试）"""
        last_error = None
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(retry_count + 1):
                try:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        content=body,
                        follow_redirects=True
                    )
                    return response
                    
                except Exception as e:
                    last_error = e
                    if attempt < retry_count:
                        await self._exponential_backoff(attempt)
                    continue
        
        raise last_error or Exception("请求失败")
    
    async def _exponential_backoff(self, attempt: int) -> None:
        """指数退避延迟"""
        import asyncio
        delay = min(2 ** attempt, 10)
        await asyncio.sleep(delay)
