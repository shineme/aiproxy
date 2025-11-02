from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
import csv
import io
import json

from app.core.database import get_db
from app.models.api_key import APIKey
from app.models.upstream import Upstream
from app.schemas.api_key import APIKeyCreate

router = APIRouter()


class BatchKeyCreate(BaseModel):
    upstream_id: int
    keys: List[dict]


class BatchOperationResult(BaseModel):
    success_count: int
    failed_count: int
    errors: List[dict]


@router.post("/keys/import-csv")
async def import_keys_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    批量导入密钥（CSV格式）
    
    CSV格式：
    upstream_id,name,key_value,location,param_name,value_prefix,enable_quota,quota_total
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="仅支持CSV文件")
    
    try:
        content = await file.read()
        csv_text = content.decode('utf-8')
        
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        success_count = 0
        failed_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                upstream_id = int(row.get('upstream_id', 0))
                
                result = await db.execute(
                    select(Upstream).where(Upstream.id == upstream_id)
                )
                if not result.scalar_one_or_none():
                    errors.append({
                        "row": row_num,
                        "error": f"上游ID {upstream_id} 不存在"
                    })
                    failed_count += 1
                    continue
                
                api_key = APIKey(
                    upstream_id=upstream_id,
                    name=row.get('name', ''),
                    key_value=row.get('key_value', ''),
                    location=row.get('location', 'header'),
                    param_name=row.get('param_name', 'Authorization'),
                    value_prefix=row.get('value_prefix', 'Bearer '),
                    enable_quota=row.get('enable_quota', '').lower() in ['true', '1', 'yes'],
                    quota_total=int(row.get('quota_total', 0)) if row.get('quota_total') else None
                )
                
                db.add(api_key)
                success_count += 1
                
            except Exception as e:
                errors.append({
                    "row": row_num,
                    "error": str(e)
                })
                failed_count += 1
        
        await db.commit()
        
        return {
            "success_count": success_count,
            "failed_count": failed_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")


@router.post("/keys/import-json")
async def import_keys_json(
    data: BatchKeyCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    批量导入密钥（JSON格式）
    """
    result = await db.execute(
        select(Upstream).where(Upstream.id == data.upstream_id)
    )
    upstream = result.scalar_one_or_none()
    
    if not upstream:
        raise HTTPException(status_code=404, detail=f"上游ID {data.upstream_id} 不存在")
    
    success_count = 0
    failed_count = 0
    errors = []
    
    for idx, key_data in enumerate(data.keys):
        try:
            api_key = APIKey(
                upstream_id=data.upstream_id,
                **key_data
            )
            db.add(api_key)
            success_count += 1
        except Exception as e:
            errors.append({
                "index": idx,
                "data": key_data,
                "error": str(e)
            })
            failed_count += 1
    
    await db.commit()
    
    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "errors": errors
    }


@router.get("/keys/export-csv")
async def export_keys_csv(
    upstream_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """导出密钥为CSV"""
    query = select(APIKey)
    if upstream_id:
        query = query.where(APIKey.upstream_id == upstream_id)
    
    result = await db.execute(query)
    keys = result.scalars().all()
    
    output = io.StringIO()
    fieldnames = [
        'id', 'upstream_id', 'name', 'key_value', 'location',
        'param_name', 'value_prefix', 'status', 'enable_quota',
        'quota_total', 'quota_used', 'created_at'
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for key in keys:
        writer.writerow({
            'id': key.id,
            'upstream_id': key.upstream_id,
            'name': key.name or '',
            'key_value': key.key_value,
            'location': key.location,
            'param_name': key.param_name,
            'value_prefix': key.value_prefix or '',
            'status': key.status,
            'enable_quota': key.enable_quota,
            'quota_total': key.quota_total or '',
            'quota_used': key.quota_used,
            'created_at': key.created_at.isoformat() if key.created_at else ''
        })
    
    from fastapi.responses import StreamingResponse
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=api_keys.csv"}
    )


@router.post("/keys/batch-update-status")
async def batch_update_key_status(
    key_ids: List[int],
    status: str,
    db: AsyncSession = Depends(get_db)
):
    """批量更新密钥状态"""
    if status not in ['active', 'disabled', 'banned']:
        raise HTTPException(status_code=400, detail="无效的状态值")
    
    result = await db.execute(
        select(APIKey).where(APIKey.id.in_(key_ids))
    )
    keys = result.scalars().all()
    
    for key in keys:
        key.status = status
    
    await db.commit()
    
    return {
        "updated_count": len(keys),
        "status": status
    }


@router.delete("/keys/batch-delete")
async def batch_delete_keys(
    key_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """批量删除密钥"""
    result = await db.execute(
        select(APIKey).where(APIKey.id.in_(key_ids))
    )
    keys = result.scalars().all()
    
    for key in keys:
        await db.delete(key)
    
    await db.commit()
    
    return {
        "deleted_count": len(keys)
    }


@router.post("/keys/import-txt")
async def import_keys_txt(
    file: UploadFile = File(...),
    upstream_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """
    从TXT文件批量导入密钥（每行一个密钥）
    
    支持以下格式：
    1. 纯密钥值（每行一个）
    2. 密钥名称:密钥值（用冒号分隔）
    """
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="仅支持TXT文件")
    
    if not upstream_id:
        raise HTTPException(status_code=400, detail="必须指定upstream_id")
    
    try:
        result = await db.execute(
            select(Upstream).where(Upstream.id == upstream_id)
        )
        upstream = result.scalar_one_or_none()
        
        if not upstream:
            raise HTTPException(status_code=404, detail=f"上游ID {upstream_id} 不存在")
        
        content = await file.read()
        text_content = content.decode('utf-8')
        
        lines = [line.strip() for line in text_content.split('\n') if line.strip()]
        
        success_count = 0
        failed_count = 0
        errors = []
        
        for idx, line in enumerate(lines, start=1):
            try:
                name = None
                key_value = line
                
                if ':' in line:
                    parts = line.split(':', 1)
                    name = parts[0].strip()
                    key_value = parts[1].strip()
                
                if not key_value:
                    errors.append({
                        "line": idx,
                        "error": "密钥值为空"
                    })
                    failed_count += 1
                    continue
                
                api_key = APIKey(
                    upstream_id=upstream_id,
                    name=name,
                    key_value=key_value,
                    location='header',
                    param_name='Authorization',
                    value_prefix='Bearer '
                )
                
                db.add(api_key)
                success_count += 1
                
            except Exception as e:
                errors.append({
                    "line": idx,
                    "error": str(e)
                })
                failed_count += 1
        
        await db.commit()
        
        return {
            "success_count": success_count,
            "failed_count": failed_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")


@router.get("/template/keys-csv")
async def get_csv_template():
    """获取CSV模板"""
    template = """upstream_id,name,key_value,location,param_name,value_prefix,enable_quota,quota_total
1,Key 1,sk-xxxxxxxxxx,header,Authorization,Bearer ,true,1000
1,Key 2,sk-yyyyyyyyyy,header,Authorization,Bearer ,true,1000
"""
    
    from fastapi.responses import Response
    return Response(
        content=template,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=keys_template.csv"}
    )


@router.get("/examples/curl")
async def get_curl_examples():
    """
    获取API批量导入的CURL调用示例
    """
    return {
        "json_import": {
            "description": "通过JSON批量导入密钥",
            "curl": """curl -X POST "http://localhost:8000/api/admin/batch/keys/import-json" \\
  -H "Content-Type: application/json" \\
  -d '{
    "upstream_id": 1,
    "keys": [
      {
        "name": "Key 1",
        "key_value": "sk-xxxxxxxxxx",
        "location": "header",
        "param_name": "Authorization",
        "value_prefix": "Bearer ",
        "enable_quota": true,
        "quota_total": 1000
      },
      {
        "name": "Key 2",
        "key_value": "sk-yyyyyyyyyy",
        "location": "header",
        "param_name": "Authorization",
        "value_prefix": "Bearer ",
        "enable_quota": true,
        "quota_total": 1000
      }
    ]
  }'""",
            "example_response": {
                "success_count": 2,
                "failed_count": 0,
                "errors": []
            }
        },
        "txt_import": {
            "description": "通过TXT文件导入密钥（每行一个）",
            "curl": """curl -X POST "http://localhost:8000/api/admin/batch/keys/import-txt?upstream_id=1" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@keys.txt"
  
# keys.txt 文件内容示例：
# sk-xxxxxxxxxx
# sk-yyyyyyyyyy
# Key3:sk-zzzzzzzzzz
# Key4:sk-aaaaaaaaaa""",
            "example_response": {
                "success_count": 4,
                "failed_count": 0,
                "errors": []
            }
        },
        "csv_import": {
            "description": "通过CSV文件导入密钥",
            "curl": """curl -X POST "http://localhost:8000/api/admin/batch/keys/import-csv" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@keys.csv"
  
# CSV 文件格式：
# upstream_id,name,key_value,location,param_name,value_prefix,enable_quota,quota_total
# 1,Key 1,sk-xxxxxxxxxx,header,Authorization,Bearer ,true,1000
# 1,Key 2,sk-yyyyyyyyyy,header,Authorization,Bearer ,true,1000""",
            "example_response": {
                "success_count": 2,
                "failed_count": 0,
                "errors": []
            }
        }
    }
