from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import re
import json

from app.models.rule import Rule
from app.models.api_key import APIKey, KeyStatus


class ProxyResponse:
    """代理响应数据结构"""
    def __init__(
        self,
        status_code: int,
        headers: Dict[str, str],
        body: str,
        latency_ms: int
    ):
        self.status_code = status_code
        self.headers = headers
        self.body = body
        self.latency_ms = latency_ms


class RuleEngine:
    """规则引擎 - 评估规则并执行相应动作"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._trigger_cache = {}
    
    async def evaluate_rules(
        self,
        upstream_id: int,
        api_key_id: int,
        response: ProxyResponse
    ) -> List[int]:
        """
        评估所有规则
        
        Returns:
            触发的规则ID列表
        """
        rules = await self._get_active_rules(upstream_id)
        triggered_rules = []
        
        for rule in rules:
            if await self._should_trigger(rule, api_key_id, response):
                triggered_rules.append(rule.id)
                await self._execute_actions(rule, api_key_id)
        
        return triggered_rules
    
    async def _get_active_rules(self, upstream_id: int) -> List[Rule]:
        """获取上游API的所有启用规则"""
        result = await self.db.execute(
            select(Rule).where(
                Rule.upstream_id == upstream_id,
                Rule.is_enabled == True
            ).order_by(Rule.priority.desc())
        )
        return result.scalars().all()
    
    async def _should_trigger(
        self,
        rule: Rule,
        api_key_id: int,
        response: ProxyResponse
    ) -> bool:
        """判断规则是否应该触发"""
        cache_key = f"{rule.id}_{api_key_id}"
        now = datetime.now()
        
        if cache_key in self._trigger_cache:
            last_trigger = self._trigger_cache[cache_key]
            if (now - last_trigger).total_seconds() < rule.cooldown_seconds:
                return False
        
        if not self._evaluate_conditions(rule.conditions, response):
            return False
        
        if rule.trigger_threshold > 1:
            return await self._check_threshold(rule, api_key_id, response)
        
        self._trigger_cache[cache_key] = now
        return True
    
    def _evaluate_conditions(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """评估条件是否满足"""
        condition_type = conditions.get("type")
        
        if condition_type == "status_code":
            return self._check_status_code(conditions, response)
        elif condition_type == "response_body":
            return self._check_response_body(conditions, response)
        elif condition_type == "json_path":
            return self._check_json_path(conditions, response)
        elif condition_type == "response_header":
            return self._check_response_header(conditions, response)
        elif condition_type == "latency":
            return self._check_latency(conditions, response)
        elif condition_type == "composite":
            return self._check_composite(conditions, response)
        
        return False
    
    def _check_status_code(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查HTTP状态码"""
        operator = conditions.get("operator", "equals")
        value = conditions.get("value")
        
        if operator == "equals":
            return response.status_code == value
        elif operator == "not_equals":
            return response.status_code != value
        elif operator == "greater_than":
            return response.status_code > value
        elif operator == "less_than":
            return response.status_code < value
        elif operator == "in_range":
            min_val, max_val = value
            return min_val <= response.status_code <= max_val
        
        return False
    
    def _check_response_body(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查响应体内容"""
        operator = conditions.get("operator", "contains")
        value = conditions.get("value", "")
        
        if operator == "contains":
            return value in response.body
        elif operator == "not_contains":
            return value not in response.body
        elif operator == "regex":
            pattern = re.compile(value)
            return pattern.search(response.body) is not None
        
        return False
    
    def _check_json_path(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查JSON路径值"""
        try:
            data = json.loads(response.body)
            path = conditions.get("path", "")
            operator = conditions.get("operator", "equals")
            expected_value = conditions.get("value")
            
            keys = path.split(".")
            current = data
            for key in keys:
                if isinstance(current, dict):
                    current = current.get(key)
                else:
                    return False
            
            if operator == "equals":
                return current == expected_value
            elif operator == "not_equals":
                return current != expected_value
            elif operator == "exists":
                return current is not None
            elif operator == "is_null":
                return current is None
            
        except (json.JSONDecodeError, KeyError, TypeError):
            return False
        
        return False
    
    def _check_response_header(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查响应头"""
        header_name = conditions.get("header_name")
        operator = conditions.get("operator", "equals")
        value = conditions.get("value")
        
        header_value = response.headers.get(header_name)
        if header_value is None:
            return operator == "not_exists"
        
        if operator == "equals":
            return header_value == value
        elif operator == "not_equals":
            return header_value != value
        elif operator == "contains":
            return value in header_value
        elif operator == "less_than":
            try:
                return int(header_value) < int(value)
            except ValueError:
                return False
        
        return False
    
    def _check_latency(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查请求延迟"""
        operator = conditions.get("operator", "greater_than")
        value = conditions.get("value", 0)
        
        if operator == "greater_than":
            return response.latency_ms > value
        elif operator == "less_than":
            return response.latency_ms < value
        
        return False
    
    def _check_composite(
        self,
        conditions: Dict[str, Any],
        response: ProxyResponse
    ) -> bool:
        """检查组合条件（AND/OR逻辑）"""
        logic = conditions.get("logic", "AND")
        sub_conditions = conditions.get("conditions", [])
        
        results = [
            self._evaluate_conditions(cond, response)
            for cond in sub_conditions
        ]
        
        if logic == "AND":
            return all(results)
        elif logic == "OR":
            return any(results)
        
        return False
    
    async def _check_threshold(
        self,
        rule: Rule,
        api_key_id: int,
        response: ProxyResponse
    ) -> bool:
        """检查触发阈值（连续N次才触发）"""
        return True
    
    async def _execute_actions(self, rule: Rule, api_key_id: int) -> None:
        """执行规则动作"""
        actions = rule.actions
        
        if "disable_key" in actions:
            await self._disable_key(api_key_id, rule)
        
        if "ban_key" in actions:
            await self._ban_key(api_key_id)
        
        if "alert" in actions:
            await self._send_alert(rule, api_key_id)
        
        if "log" in actions:
            await self._log_action(rule, api_key_id)
    
    async def _disable_key(self, api_key_id: int, rule: Rule) -> None:
        """禁用密钥"""
        result = await self.db.execute(
            select(APIKey).where(APIKey.id == api_key_id)
        )
        key = result.scalar_one_or_none()
        
        if key:
            key.status = KeyStatus.DISABLED
            
            if rule.auto_enable_delay_hours:
                key.auto_enable_at = datetime.now() + timedelta(
                    hours=rule.auto_enable_delay_hours
                )
            
            await self.db.commit()
    
    async def _ban_key(self, api_key_id: int) -> None:
        """封禁密钥（永久禁用）"""
        result = await self.db.execute(
            select(APIKey).where(APIKey.id == api_key_id)
        )
        key = result.scalar_one_or_none()
        
        if key:
            key.status = KeyStatus.BANNED
            await self.db.commit()
    
    async def _send_alert(self, rule: Rule, api_key_id: int) -> None:
        """发送告警（占位符，待实现通知系统）"""
        pass
    
    async def _log_action(self, rule: Rule, api_key_id: int) -> None:
        """记录日志"""
        pass
