from typing import Dict, Any, List, Optional
import asyncio
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NotificationChannel:
    """通知渠道基类"""
    
    async def send(self, message: Dict[str, Any]) -> bool:
        """发送通知"""
        raise NotImplementedError


class EmailChannel(NotificationChannel):
    """邮件通知渠道"""
    
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str,
        from_email: str
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email
    
    async def send(self, message: Dict[str, Any]) -> bool:
        """发送邮件"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = message.get('to', '')
            msg['Subject'] = message.get('subject', 'API Gateway 告警')
            
            body = message.get('body', '')
            msg.attach(MIMEText(body, 'html'))
            
            await asyncio.to_thread(self._send_email, msg)
            
            logger.info(f"Email sent to {message.get('to')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def _send_email(self, msg):
        """同步发送邮件"""
        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)


class WebhookChannel(NotificationChannel):
    """Webhook通知渠道"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send(self, message: Dict[str, Any]) -> bool:
        """发送Webhook"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.webhook_url,
                    json=message
                )
                response.raise_for_status()
            
            logger.info(f"Webhook sent to {self.webhook_url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send webhook: {e}")
            return False


class DingTalkChannel(NotificationChannel):
    """钉钉通知渠道"""
    
    def __init__(self, webhook_url: str, secret: Optional[str] = None):
        self.webhook_url = webhook_url
        self.secret = secret
    
    async def send(self, message: Dict[str, Any]) -> bool:
        """发送钉钉消息"""
        try:
            import time
            import hmac
            import hashlib
            import base64
            import urllib.parse
            
            url = self.webhook_url
            
            if self.secret:
                timestamp = str(round(time.time() * 1000))
                secret_enc = self.secret.encode('utf-8')
                string_to_sign = '{}\n{}'.format(timestamp, self.secret)
                string_to_sign_enc = string_to_sign.encode('utf-8')
                hmac_code = hmac.new(secret_enc, string_to_sign_enc, digestmod=hashlib.sha256).digest()
                sign = urllib.parse.quote_plus(base64.b64encode(hmac_code))
                url = f"{url}&timestamp={timestamp}&sign={sign}"
            
            payload = {
                "msgtype": "markdown",
                "markdown": {
                    "title": message.get('title', 'API Gateway 告警'),
                    "text": message.get('text', '')
                }
            }
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            logger.info("DingTalk notification sent")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send DingTalk notification: {e}")
            return False


class NotificationService:
    """通知服务"""
    
    def __init__(self):
        self.channels: Dict[str, NotificationChannel] = {}
    
    def add_channel(self, name: str, channel: NotificationChannel):
        """添加通知渠道"""
        self.channels[name] = channel
    
    async def send_notification(
        self,
        event_type: str,
        data: Dict[str, Any],
        channels: Optional[List[str]] = None
    ) -> Dict[str, bool]:
        """
        发送通知
        
        Args:
            event_type: 事件类型（key_disabled, key_banned, quota_exceeded等）
            data: 事件数据
            channels: 指定的渠道列表，None表示所有渠道
        
        Returns:
            各渠道的发送结果
        """
        if channels is None:
            channels = list(self.channels.keys())
        
        message = self._build_message(event_type, data)
        
        results = {}
        for channel_name in channels:
            if channel_name in self.channels:
                try:
                    success = await self.channels[channel_name].send(message)
                    results[channel_name] = success
                except Exception as e:
                    logger.error(f"Error sending to {channel_name}: {e}")
                    results[channel_name] = False
        
        return results
    
    def _build_message(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """构建通知消息"""
        templates = {
            "key_disabled": {
                "title": "🔴 密钥已禁用",
                "subject": "API Gateway - 密钥禁用告警",
                "text": f"""
### API Gateway 告警通知

**事件类型**: 密钥禁用

**密钥信息**:
- ID: {data.get('key_id')}
- 名称: {data.get('key_name', 'N/A')}
- 上游: {data.get('upstream_name', 'N/A')}

**原因**: {data.get('reason', '未知')}

**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---
*API Gateway Pro 自动告警*
                """
            },
            "key_banned": {
                "title": "🚫 密钥已封禁",
                "subject": "API Gateway - 密钥封禁告警",
                "text": f"""
### API Gateway 严重告警

**事件类型**: 密钥封禁

**密钥信息**:
- ID: {data.get('key_id')}
- 名称: {data.get('key_name', 'N/A')}
- 上游: {data.get('upstream_name', 'N/A')}

**原因**: {data.get('reason', '触发封禁规则')}

**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

⚠️ **请立即检查并处理**

---
*API Gateway Pro 自动告警*
                """
            },
            "quota_exceeded": {
                "title": "⚠️ 配额用尽",
                "subject": "API Gateway - 配额告警",
                "text": f"""
### API Gateway 配额告警

**事件类型**: 配额用尽

**密钥信息**:
- ID: {data.get('key_id')}
- 名称: {data.get('key_name', 'N/A')}
- 已用/总计: {data.get('quota_used')}/{data.get('quota_total')}

**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---
*API Gateway Pro 自动告警*
                """
            },
            "rate_limit_exceeded": {
                "title": "⚠️ 频率限制",
                "subject": "API Gateway - 频率限制告警",
                "text": f"""
### API Gateway 频率限制告警

**事件类型**: 超过频率限制

**详情**:
- 上游: {data.get('upstream_name', 'N/A')}
- 限制类型: {data.get('limit_type', 'N/A')}
- 当前请求数: {data.get('current_requests')}
- 限制阈值: {data.get('limit')}

**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---
*API Gateway Pro 自动告警*
                """
            }
        }
        
        template = templates.get(event_type, {
            "title": "API Gateway 通知",
            "subject": "API Gateway 通知",
            "text": f"事件: {event_type}\n数据: {data}"
        })
        
        return {
            "title": template["title"],
            "subject": template["subject"],
            "text": template["text"],
            "body": template["text"].replace('\n', '<br>'),
            "to": data.get('notify_email', ''),
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }


notification_service = NotificationService()
