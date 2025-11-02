from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.request_log import RequestLog
from app.schemas.request_log import RequestLogResponse

router = APIRouter()


@router.get("", response_model=List[RequestLogResponse])
async def list_request_logs(
    upstream_id: int = None,
    api_key_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    query = select(RequestLog).order_by(desc(RequestLog.created_at))
    
    if upstream_id:
        query = query.where(RequestLog.upstream_id == upstream_id)
    
    if api_key_id:
        query = query.where(RequestLog.api_key_id == api_key_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


@router.get("/{log_id}", response_model=RequestLogResponse)
async def get_request_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RequestLog).where(RequestLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Request log not found")
    return log


@router.get("/stats/summary")
async def get_stats_summary(
    upstream_id: int = None,
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    since = datetime.now() - timedelta(days=days)
    
    query = select(RequestLog).where(RequestLog.created_at >= since)
    
    if upstream_id:
        query = query.where(RequestLog.upstream_id == upstream_id)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    total_requests = len(logs)
    successful_requests = sum(1 for log in logs if log.status_code and 200 <= log.status_code < 300)
    success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
    
    avg_latency = sum(log.latency_ms for log in logs if log.latency_ms) / len(logs) if logs else 0
    
    return {
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "success_rate": round(success_rate, 2),
        "average_latency_ms": round(avg_latency, 2)
    }
