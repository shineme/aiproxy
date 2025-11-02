from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.upstream import Upstream
from app.schemas.upstream import UpstreamCreate, UpstreamUpdate, UpstreamResponse

router = APIRouter()


@router.get("", response_model=List[UpstreamResponse])
async def list_upstreams(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Upstream).offset(skip).limit(limit)
    )
    upstreams = result.scalars().all()
    return upstreams


@router.post("", response_model=UpstreamResponse)
async def create_upstream(
    upstream: UpstreamCreate,
    db: AsyncSession = Depends(get_db)
):
    db_upstream = Upstream(**upstream.model_dump())
    db.add(db_upstream)
    await db.commit()
    await db.refresh(db_upstream)
    return db_upstream


@router.get("/{upstream_id}", response_model=UpstreamResponse)
async def get_upstream(
    upstream_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Upstream).where(Upstream.id == upstream_id)
    )
    upstream = result.scalar_one_or_none()
    if not upstream:
        raise HTTPException(status_code=404, detail="Upstream not found")
    return upstream


@router.put("/{upstream_id}", response_model=UpstreamResponse)
async def update_upstream(
    upstream_id: int,
    upstream_update: UpstreamUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Upstream).where(Upstream.id == upstream_id)
    )
    upstream = result.scalar_one_or_none()
    if not upstream:
        raise HTTPException(status_code=404, detail="Upstream not found")
    
    update_data = upstream_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(upstream, key, value)
    
    await db.commit()
    await db.refresh(upstream)
    return upstream


@router.delete("/{upstream_id}")
async def delete_upstream(
    upstream_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Upstream).where(Upstream.id == upstream_id)
    )
    upstream = result.scalar_one_or_none()
    if not upstream:
        raise HTTPException(status_code=404, detail="Upstream not found")
    
    await db.delete(upstream)
    await db.commit()
    return {"message": "Upstream deleted successfully"}
