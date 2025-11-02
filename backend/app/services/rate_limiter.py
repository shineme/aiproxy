from typing import Dict, Optional
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """频率限制器 - 基于滑动窗口算法"""
    
    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ) -> Dict[str, any]:
        """
        检查是否超过频率限制
        
        Args:
            key: 限制键（例如: "upstream:1:key:5"）
            limit: 限制次数
            window_seconds: 时间窗口（秒）
        
        Returns:
            {
                "allowed": bool,
                "current": int,
                "limit": int,
                "reset_at": datetime
            }
        """
        async with self._lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=window_seconds)
            
            self._requests[key] = [
                req_time for req_time in self._requests[key]
                if req_time > window_start
            ]
            
            current_count = len(self._requests[key])
            allowed = current_count < limit
            
            if allowed:
                self._requests[key].append(now)
            
            reset_at = now + timedelta(seconds=window_seconds)
            
            return {
                "allowed": allowed,
                "current": current_count + (1 if allowed else 0),
                "limit": limit,
                "remaining": max(0, limit - current_count - (1 if allowed else 0)),
                "reset_at": reset_at.isoformat()
            }
    
    async def cleanup_old_entries(self, max_age_seconds: int = 3600):
        """清理过期的请求记录"""
        async with self._lock:
            cutoff_time = datetime.now() - timedelta(seconds=max_age_seconds)
            
            for key in list(self._requests.keys()):
                self._requests[key] = [
                    req_time for req_time in self._requests[key]
                    if req_time > cutoff_time
                ]
                
                if not self._requests[key]:
                    del self._requests[key]
            
            logger.info(f"Cleaned up rate limiter, active keys: {len(self._requests)}")


class RateLimitConfig:
    """频率限制配置"""
    
    def __init__(
        self,
        enabled: bool = False,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        requests_per_day: int = 10000
    ):
        self.enabled = enabled
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.requests_per_day = requests_per_day


rate_limiter = RateLimiter()


async def check_upstream_rate_limit(
    upstream_id: int,
    api_key_id: Optional[int] = None,
    config: Optional[RateLimitConfig] = None
) -> Dict[str, any]:
    """
    检查上游API的频率限制
    
    Args:
        upstream_id: 上游ID
        api_key_id: 密钥ID（可选）
        config: 频率限制配置
    
    Returns:
        频率限制检查结果
    """
    if not config or not config.enabled:
        return {
            "allowed": True,
            "message": "Rate limiting disabled"
        }
    
    key_suffix = f":key:{api_key_id}" if api_key_id else ""
    base_key = f"upstream:{upstream_id}{key_suffix}"
    
    minute_result = await rate_limiter.check_rate_limit(
        f"{base_key}:minute",
        config.requests_per_minute,
        60
    )
    
    if not minute_result["allowed"]:
        return {
            "allowed": False,
            "reason": "minute_limit_exceeded",
            "message": f"超过每分钟请求限制（{config.requests_per_minute}次）",
            "retry_after": 60,
            "details": minute_result
        }
    
    hour_result = await rate_limiter.check_rate_limit(
        f"{base_key}:hour",
        config.requests_per_hour,
        3600
    )
    
    if not hour_result["allowed"]:
        return {
            "allowed": False,
            "reason": "hour_limit_exceeded",
            "message": f"超过每小时请求限制（{config.requests_per_hour}次）",
            "retry_after": 3600,
            "details": hour_result
        }
    
    day_result = await rate_limiter.check_rate_limit(
        f"{base_key}:day",
        config.requests_per_day,
        86400
    )
    
    if not day_result["allowed"]:
        return {
            "allowed": False,
            "reason": "day_limit_exceeded",
            "message": f"超过每日请求限制（{config.requests_per_day}次）",
            "retry_after": 86400,
            "details": day_result
        }
    
    return {
        "allowed": True,
        "minute": minute_result,
        "hour": hour_result,
        "day": day_result
    }
