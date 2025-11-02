from typing import Optional, Dict, Any
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


class ScriptExecutor:
    """脚本执行器 - 支持JavaScript和Python脚本"""
    
    def __init__(self, timeout_ms: int = 1000):
        self.timeout_ms = timeout_ms
    
    async def execute_javascript(
        self,
        script: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        执行JavaScript脚本
        
        Args:
            script: JavaScript代码
            context: 执行上下文（可用变量）
        
        Returns:
            脚本执行结果（字符串）
        """
        try:
            from py_mini_racer import MiniRacer
            
            mr = MiniRacer()
            
            if context:
                for key, value in context.items():
                    mr.eval(f"var {key} = {json.dumps(value)};")
            
            timeout_seconds = self.timeout_ms / 1000
            result = await asyncio.wait_for(
                asyncio.to_thread(mr.eval, script),
                timeout=timeout_seconds
            )
            
            return str(result) if result is not None else ""
            
        except asyncio.TimeoutError:
            logger.error(f"JavaScript execution timeout after {self.timeout_ms}ms")
            raise Exception(f"脚本执行超时（{self.timeout_ms}ms）")
        except ImportError:
            logger.error("py-mini-racer not installed")
            raise Exception("JavaScript引擎未安装，请安装 py-mini-racer")
        except Exception as e:
            logger.error(f"JavaScript execution error: {e}")
            raise Exception(f"脚本执行失败: {str(e)}")
    
    async def execute_python(
        self,
        script: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        执行Python脚本（受限环境）
        
        Args:
            script: Python代码
            context: 执行上下文
        
        Returns:
            脚本执行结果
        """
        try:
            from RestrictedPython import compile_restricted
            from RestrictedPython.Guards import safe_builtins, safe_globals
            
            restricted_globals = {
                '__builtins__': safe_builtins,
                '_getattr_': getattr,
            }
            
            if context:
                restricted_globals.update(context)
            
            byte_code = compile_restricted(script, '<string>', 'exec')
            
            if byte_code.errors:
                raise Exception(f"Python脚本编译错误: {byte_code.errors}")
            
            exec(byte_code, restricted_globals)
            
            if 'result' in restricted_globals:
                return str(restricted_globals['result'])
            
            return ""
            
        except ImportError:
            logger.error("RestrictedPython not installed")
            raise Exception("Python脚本执行功能未启用")
        except Exception as e:
            logger.error(f"Python execution error: {e}")
            raise Exception(f"Python脚本执行失败: {str(e)}")
    
    async def execute(
        self,
        script_type: str,
        script: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        执行脚本（根据类型选择执行器）
        
        Args:
            script_type: 'javascript' 或 'python'
            script: 脚本内容
            context: 执行上下文
        
        Returns:
            执行结果
        """
        if script_type == "javascript":
            return await self.execute_javascript(script, context)
        elif script_type == "python":
            return await self.execute_python(script, context)
        else:
            raise Exception(f"不支持的脚本类型: {script_type}")


async def test_script(script_type: str, script: str) -> Dict[str, Any]:
    """
    测试脚本执行
    
    Args:
        script_type: 脚本类型
        script: 脚本内容
    
    Returns:
        测试结果
    """
    executor = ScriptExecutor(timeout_ms=5000)
    
    try:
        context = {
            "timestamp": "2025-11-02T10:00:00Z",
            "request": {
                "method": "GET",
                "path": "/test"
            }
        }
        
        result = await executor.execute(script_type, script, context)
        
        return {
            "success": True,
            "result": result,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "result": None,
            "error": str(e)
        }
