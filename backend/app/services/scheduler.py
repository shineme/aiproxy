from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from app.models.api_key import APIKey, KeyStatus
from app.models.request_log import RequestLog
from app.core.database import AsyncSessionLocal
from app.core.config import settings

logger = logging.getLogger(__name__)


class TaskScheduler:
    """定时任务调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        """启动调度器"""
        self._register_tasks()
        self.scheduler.start()
        logger.info("定时任务调度器已启动")
    
    def shutdown(self):
        """停止调度器"""
        self.scheduler.shutdown()
        logger.info("定时任务调度器已停止")
    
    def _register_tasks(self):
        """注册所有定时任务"""
        self.scheduler.add_job(
            self._reset_daily_quota,
            CronTrigger(hour=0, minute=0),
            id="reset_daily_quota",
            name="重置每日配额",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self._auto_enable_keys,
            IntervalTrigger(minutes=10),
            id="auto_enable_keys",
            name="自动启用密钥",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self._cleanup_old_logs,
            CronTrigger(hour=2, minute=0),
            id="cleanup_old_logs",
            name="清理旧日志",
            replace_existing=True
        )
    
    async def _reset_daily_quota(self):
        """重置每日配额"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(APIKey).where(
                        APIKey.enable_quota == True,
                        APIKey.quota_reset_at <= datetime.now()
                    )
                )
                keys = result.scalars().all()
                
                for key in keys:
                    key.quota_used = 0
                    key.quota_reset_at = datetime.now() + timedelta(days=1)
                
                await db.commit()
                logger.info(f"已重置 {len(keys)} 个密钥的配额")
                
        except Exception as e:
            logger.error(f"重置配额失败: {e}")
    
    async def _auto_enable_keys(self):
        """自动启用密钥"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(APIKey).where(
                        APIKey.status == KeyStatus.DISABLED,
                        APIKey.auto_enable_at.isnot(None),
                        APIKey.auto_enable_at <= datetime.now()
                    )
                )
                keys = result.scalars().all()
                
                for key in keys:
                    key.status = KeyStatus.ACTIVE
                    key.auto_enable_at = None
                    key.quota_used = 0
                
                await db.commit()
                logger.info(f"已自动启用 {len(keys)} 个密钥")
                
        except Exception as e:
            logger.error(f"自动启用密钥失败: {e}")
    
    async def _cleanup_old_logs(self):
        """清理旧日志"""
        try:
            async with AsyncSessionLocal() as db:
                cutoff_date = datetime.now() - timedelta(days=settings.LOG_RETENTION_DAYS)
                
                result = await db.execute(
                    select(RequestLog).where(
                        RequestLog.created_at < cutoff_date
                    )
                )
                logs = result.scalars().all()
                
                for log in logs:
                    await db.delete(log)
                
                await db.commit()
                logger.info(f"已清理 {len(logs)} 条旧日志")
                
        except Exception as e:
            logger.error(f"清理日志失败: {e}")


task_scheduler = TaskScheduler()
