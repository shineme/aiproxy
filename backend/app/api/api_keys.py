from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.api_key import APIKey, KeyStatus
from app.schemas.api_key import APIKeyCreate, APIKeyUpdate, APIKeyResponse

router = APIRouter()


@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    upstream_id: int = None,
    status: KeyStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    query = select(APIKey)
    
    if upstream_id:
        query = query.where(APIKey.upstream_id == upstream_id)
    
    if status:
        query = query.where(APIKey.status == status)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    keys = result.scalars().all()
    return keys


@router.post("", response_model=APIKeyResponse)
async def create_api_key(
    api_key: APIKeyCreate,
    db: AsyncSession = Depends(get_db)
):
    db_key = APIKey(**api_key.model_dump())
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)
    return db_key


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    return api_key


@router.put("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: int,
    key_update: APIKeyUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    update_data = key_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(api_key, key, value)
    
    await db.commit()
    await db.refresh(api_key)
    return api_key


@router.delete("/{key_id}")
async def delete_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    await db.delete(api_key)
    await db.commit()
    return {"message": "API key deleted successfully"}


@router.post("/{key_id}/enable")
async def enable_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.status = KeyStatus.ACTIVE
    api_key.auto_enable_at = None
    
    await db.commit()
    await db.refresh(api_key)
    return api_key


@router.post("/{key_id}/disable")
async def disable_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.status = KeyStatus.DISABLED
    
    await db.commit()
    await db.refresh(api_key)
    return api_key
