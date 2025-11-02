from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.database import get_db
from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    verify_password,
    get_password_hash
)
from app.models.admin_user import AdminUser
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    PasswordChangeRequest,
    UserResponse
)
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """用户登录"""
    user = await authenticate_user(db, request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: AdminUser = Depends(get_current_user)
):
    """获取当前用户信息"""
    if not current_user:
        raise HTTPException(status_code=401, detail="认证未启用或用户未登录")
    return current_user


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """修改密码"""
    if not current_user:
        raise HTTPException(status_code=401, detail="认证未启用或用户未登录")
    
    if not verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="原密码错误")
    
    current_user.hashed_password = get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "密码修改成功"}


@router.post("/init-admin")
async def init_admin(
    username: str = "admin",
    password: str = "admin123",
    db: AsyncSession = Depends(get_db)
):
    """初始化管理员账户（仅在没有管理员时可用）"""
    result = await db.execute(select(AdminUser))
    existing_users = result.scalars().all()
    
    if len(existing_users) > 0:
        raise HTTPException(status_code=400, detail="管理员账户已存在")
    
    admin_user = AdminUser(
        username=username,
        hashed_password=get_password_hash(password),
        is_active=True
    )
    
    db.add(admin_user)
    await db.commit()
    
    return {
        "message": "管理员账户创建成功",
        "username": username,
        "password": password
    }


@router.get("/status")
async def auth_status():
    """获取认证状态"""
    return {
        "enabled": settings.ENABLE_AUTH,
        "message": "认证已启用" if settings.ENABLE_AUTH else "认证未启用"
    }
