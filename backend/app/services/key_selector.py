from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import random

from app.models.api_key import APIKey, KeyStatus
from app.models.upstream import Upstream


class KeySelector:
    """密钥选择器 - 实现智能密钥轮询和选择"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._last_selected_index = {}
    
    async def select_key(
        self,
        upstream_id: int,
        strategy: str = "round_robin"
    ) -> Optional[APIKey]:
        """
        选择一个可用的API密钥
        
        Args:
            upstream_id: 上游API ID
            strategy: 选择策略 (round_robin, random, weighted)
        
        Returns:
            可用的API密钥，如果没有可用密钥则返回None
        """
        available_keys = await self._get_available_keys(upstream_id)
        
        if not available_keys:
            return None
        
        if strategy == "round_robin":
            return self._round_robin_select(upstream_id, available_keys)
        elif strategy == "random":
            return self._random_select(available_keys)
        elif strategy == "weighted":
            return self._weighted_select(available_keys)
        else:
            return self._round_robin_select(upstream_id, available_keys)
    
    async def _get_available_keys(self, upstream_id: int) -> List[APIKey]:
        """获取所有可用的密钥（状态为ACTIVE且配额未用尽）"""
        query = select(APIKey).where(
            APIKey.upstream_id == upstream_id,
            APIKey.status == KeyStatus.ACTIVE
        )
        
        result = await self.db.execute(query)
        keys = result.scalars().all()
        
        available = []
        for key in keys:
            if self._check_quota_available(key):
                available.append(key)
        
        return available
    
    def _check_quota_available(self, key: APIKey) -> bool:
        """检查密钥配额是否可用"""
        if not key.enable_quota:
            return True
        
        if key.quota_total is None:
            return True
        
        if key.quota_used >= key.quota_total:
            return False
        
        if key.quota_reset_at and datetime.now() >= key.quota_reset_at:
            return True
        
        return True
    
    def _round_robin_select(self, upstream_id: int, keys: List[APIKey]) -> APIKey:
        """轮询选择策略"""
        if upstream_id not in self._last_selected_index:
            self._last_selected_index[upstream_id] = 0
        else:
            self._last_selected_index[upstream_id] = (
                self._last_selected_index[upstream_id] + 1
            ) % len(keys)
        
        return keys[self._last_selected_index[upstream_id]]
    
    def _random_select(self, keys: List[APIKey]) -> APIKey:
        """随机选择策略"""
        return random.choice(keys)
    
    def _weighted_select(self, keys: List[APIKey]) -> APIKey:
        """
        加权选择策略
        根据配额剩余量进行加权，剩余配额越多权重越高
        """
        weights = []
        for key in keys:
            if not key.enable_quota or key.quota_total is None:
                weights.append(100)
            else:
                remaining = key.quota_total - key.quota_used
                weight = max(1, remaining)
                weights.append(weight)
        
        return random.choices(keys, weights=weights, k=1)[0]
    
    async def increment_usage(self, key_id: int) -> None:
        """增加密钥使用次数"""
        result = await self.db.execute(
            select(APIKey).where(APIKey.id == key_id)
        )
        key = result.scalar_one_or_none()
        
        if key and key.enable_quota:
            key.quota_used += 1
            key.last_used_at = datetime.now()
            
            if key.quota_total and key.quota_used >= key.quota_total:
                if key.auto_disable_on_failure:
                    key.status = KeyStatus.DISABLED
                    if key.auto_enable_delay_hours:
                        from datetime import timedelta
                        key.auto_enable_at = datetime.now() + timedelta(
                            hours=key.auto_enable_delay_hours
                        )
            
            await self.db.commit()
