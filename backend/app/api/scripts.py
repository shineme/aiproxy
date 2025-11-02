from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.script_executor import test_script

router = APIRouter()


class ScriptTestRequest(BaseModel):
    script_type: str
    script_content: str
    context: Optional[Dict[str, Any]] = None


@router.post("/test")
async def test_script_execution(request: ScriptTestRequest):
    """
    测试脚本执行
    
    支持JavaScript和Python脚本测试
    """
    result = await test_script(request.script_type, request.script_content)
    return result


@router.get("/examples")
async def get_script_examples():
    """获取脚本示例"""
    return {
        "javascript": {
            "timestamp": {
                "name": "生成时间戳",
                "script": "return new Date().toISOString();"
            },
            "uuid": {
                "name": "生成UUID",
                "script": "return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {\n  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);\n  return v.toString(16);\n});"
            },
            "signature": {
                "name": "生成签名",
                "script": "var timestamp = Date.now();\nvar nonce = Math.random().toString(36).substring(7);\nreturn 'signature_' + timestamp + '_' + nonce;"
            }
        },
        "python": {
            "timestamp": {
                "name": "生成时间戳",
                "script": "from datetime import datetime\nresult = datetime.now().isoformat()"
            },
            "random": {
                "name": "生成随机数",
                "script": "import random\nresult = str(random.randint(1000, 9999))"
            }
        }
    }
