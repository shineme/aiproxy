from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.upstream import Upstream
from app.models.api_key import APIKey, KeyStatus
from app.models.request_log import RequestLog

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(func.count(RequestLog.id)).where(RequestLog.created_at >= today)
    )
    today_requests = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(RequestLog.id)).where(
            RequestLog.created_at >= today,
            RequestLog.status_code >= 200,
            RequestLog.status_code < 300
        )
    )
    successful_requests = result.scalar() or 0
    
    success_rate = (successful_requests / today_requests * 100) if today_requests > 0 else 0
    
    result = await db.execute(
        select(func.count(APIKey.id)).where(APIKey.status == KeyStatus.ACTIVE)
    )
    active_keys = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(APIKey.id))
    )
    total_keys = result.scalar() or 0
    
    result = await db.execute(
        select(func.avg(RequestLog.latency_ms)).where(
            RequestLog.created_at >= today,
            RequestLog.latency_ms.isnot(None)
        )
    )
    avg_latency = result.scalar() or 0
    
    return {
        "today_requests": today_requests,
        "success_rate": round(success_rate, 2),
        "active_keys": active_keys,
        "total_keys": total_keys,
        "average_latency_ms": round(avg_latency, 2) if avg_latency else 0
    }


@router.get("/realtime")
async def get_realtime_data(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RequestLog).order_by(RequestLog.created_at.desc()).limit(limit)
    )
    recent_logs = result.scalars().all()
    
    return {
        "recent_requests": [
            {
                "id": log.id,
                "method": log.method,
                "path": log.path,
                "status_code": log.status_code,
                "latency_ms": log.latency_ms,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in recent_logs
        ]
    }
