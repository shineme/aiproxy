from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.upstream import Upstream
from app.services.proxy import ProxyService

router = APIRouter()


@router.api_route(
    "/proxy/{upstream_name}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
)
async def proxy_request(
    upstream_name: str,
    path: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    代理请求转发
    
    路由格式: /proxy/{upstream_name}/{path}
    例如: /proxy/openai/v1/chat/completions
    """
    result = await db.execute(
        select(Upstream).where(
            Upstream.name == upstream_name,
            Upstream.is_enabled == True
        )
    )
    upstream = result.scalar_one_or_none()
    
    if not upstream:
        raise HTTPException(
            status_code=404,
            detail=f"上游API '{upstream_name}' 不存在或已禁用"
        )
    
    headers = dict(request.headers)
    body = await request.body()
    client_ip = request.client.host if request.client else "unknown"
    
    proxy_service = ProxyService(db)
    
    try:
        proxy_response = await proxy_service.forward_request(
            upstream=upstream,
            method=request.method,
            path=path,
            headers=headers,
            body=body if body else None,
            client_ip=client_ip
        )
        
        return Response(
            content=proxy_response.body,
            status_code=proxy_response.status_code,
            headers=dict(proxy_response.headers),
            media_type="application/json"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"代理请求失败: {str(e)}"
        )
