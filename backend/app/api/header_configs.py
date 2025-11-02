from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.header_config import HeaderConfig
from app.schemas.header_config import HeaderConfigCreate, HeaderConfigUpdate, HeaderConfigResponse

router = APIRouter()


@router.get("", response_model=List[HeaderConfigResponse])
async def list_header_configs(
    upstream_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    query = select(HeaderConfig)
    
    if upstream_id:
        query = query.where(HeaderConfig.upstream_id == upstream_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    headers = result.scalars().all()
    return headers


@router.post("", response_model=HeaderConfigResponse)
async def create_header_config(
    header: HeaderConfigCreate,
    db: AsyncSession = Depends(get_db)
):
    db_header = HeaderConfig(**header.model_dump())
    db.add(db_header)
    await db.commit()
    await db.refresh(db_header)
    return db_header


@router.get("/{header_id}", response_model=HeaderConfigResponse)
async def get_header_config(
    header_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(HeaderConfig).where(HeaderConfig.id == header_id)
    )
    header = result.scalar_one_or_none()
    if not header:
        raise HTTPException(status_code=404, detail="Header config not found")
    return header


@router.put("/{header_id}", response_model=HeaderConfigResponse)
async def update_header_config(
    header_id: int,
    header_update: HeaderConfigUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(HeaderConfig).where(HeaderConfig.id == header_id)
    )
    header = result.scalar_one_or_none()
    if not header:
        raise HTTPException(status_code=404, detail="Header config not found")
    
    update_data = header_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(header, key, value)
    
    await db.commit()
    await db.refresh(header)
    return header


@router.delete("/{header_id}")
async def delete_header_config(
    header_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(HeaderConfig).where(HeaderConfig.id == header_id)
    )
    header = result.scalar_one_or_none()
    if not header:
        raise HTTPException(status_code=404, detail="Header config not found")
    
    await db.delete(header)
    await db.commit()
    return {"message": "Header config deleted successfully"}
