#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "    API Gateway Pro - 完整性检查"
echo "=========================================="
echo ""

# 计数器
total=0
passed=0

check_file() {
    total=$((total + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        passed=$((passed + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $2 (文件不存在: $1)"
        return 1
    fi
}

check_content() {
    total=$((total + 1))
    if grep -q "$1" "$2" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        passed=$((passed + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $3 (在 $2 中未找到: $1)"
        return 1
    fi
}

echo "=== 问题 1 & 3: 上游选择功能 ==="
check_file "frontend/src/app/keys/page.tsx" "密钥管理页面"
check_file "frontend/src/app/headers/page.tsx" "请求头配置页面"
check_content "upstreamsApi.list()" "frontend/src/app/keys/page.tsx" "密钥页面加载上游列表"
check_content "upstreamsApi.list()" "frontend/src/app/headers/page.tsx" "请求头页面加载上游列表"
echo ""

echo "=== 问题 2: 批量导入功能 ==="
check_file "backend/app/api/batch.py" "批量导入 API"
check_content "import-txt" "backend/app/api/batch.py" "TXT 导入功能"
check_content "import-csv" "backend/app/api/batch.py" "CSV 导入功能"
check_content "import-json" "backend/app/api/batch.py" "JSON 导入功能"
check_content "examples/curl" "backend/app/api/batch.py" "CURL 示例接口"
check_file "docs/BATCH_IMPORT_GUIDE.md" "批量导入文档"
echo ""

echo "=== 问题 4: 规则配置 ==="
check_file "frontend/src/app/rules/page.tsx" "规则配置页面"
check_content "handleSubmit" "frontend/src/app/rules/page.tsx" "规则提交处理"
check_content "showForm" "frontend/src/app/rules/page.tsx" "规则表单显示"
echo ""

echo "=== 问题 5: Logs 页面 ==="
check_file "frontend/src/app/logs/page.tsx" "Logs 页面"
check_content "logsApi" "frontend/src/app/logs/page.tsx" "日志 API 调用"
check_content "RequestLog" "frontend/src/app/logs/page.tsx" "日志类型定义"
echo ""

echo "=== 问题 6: 脚本执行 ==="
check_file "backend/app/services/script_executor.py" "脚本执行器"
check_content "sys.version_info" "backend/app/services/script_executor.py" "asyncio.to_thread 兼容性"
check_content "ENABLE_PYTHON_SCRIPTS" "backend/app/services/script_executor.py" "Python 脚本配置检查"
check_content "ENABLE_PYTHON_SCRIPTS" "backend/app/core/config.py" "Python 脚本配置定义"
echo ""

echo "=== 问题 7: 认证系统 ==="
check_file "backend/app/api/auth.py" "认证 API"
check_file "backend/app/core/auth.py" "认证核心模块"
check_file "backend/app/models/admin_user.py" "管理员用户模型"
check_file "backend/app/schemas/auth.py" "认证 Schema"
check_file "frontend/src/app/login/page.tsx" "登录页面"
check_file "frontend/src/lib/auth.ts" "认证服务"
check_content "auth.router" "backend/app/main.py" "认证路由注册"
check_content "AdminUser" "backend/app/models/__init__.py" "管理员模型导出"
check_content "authService" "frontend/src/components/Layout.tsx" "前端认证集成"
check_content "PasswordChangeModal" "frontend/src/components/Layout.tsx" "密码修改功能"
check_file "docs/AUTH_GUIDE.md" "认证系统文档"
check_file "docs/FRONTEND_AUTH_GUIDE.md" "前端认证文档"
echo ""

echo "=== 问题 8: .env 配置 ==="
check_file ".env.example" ".env.example 文件"
check_content "ENABLE_AUTH" ".env.example" "认证配置说明"
check_content "ENABLE_PYTHON_SCRIPTS" ".env.example" "Python 脚本配置说明"
check_content "SECRET_KEY" ".env.example" "密钥配置说明"
check_content "DATABASE_URL" ".env.example" "数据库配置说明"
echo ""

echo "=== API 导出检查 ==="
check_file "frontend/src/lib/api.ts" "API 客户端"
check_content "keysApi" "frontend/src/lib/api.ts" "密钥 API 导出"
check_content "headersApi" "frontend/src/lib/api.ts" "请求头 API 导出"
check_content "logsApi" "frontend/src/lib/api.ts" "日志 API 导出"
check_content "export \* from '@/types'" "frontend/src/lib/api.ts" "类型导出"
echo ""

echo "=== 其他文档 ==="
check_file "ISSUES_FIXED.md" "问题修复总结"
check_file "VERIFICATION_CHECKLIST.md" "验证清单"
echo ""

echo "=========================================="
echo "          检查结果汇总"
echo "=========================================="
echo -e "总检查项: ${YELLOW}$total${NC}"
echo -e "通过项: ${GREEN}$passed${NC}"
echo -e "失败项: ${RED}$((total - passed))${NC}"
echo ""

if [ $passed -eq $total ]; then
    echo -e "${GREEN}🎉 所有检查项都通过！${NC}"
    echo ""
    echo "下一步操作："
    echo "1. 启动后端: cd backend && python -m uvicorn app.main:app --reload"
    echo "2. 启动前端: cd frontend && npm run dev"
    echo "3. 访问: http://localhost:3000"
    echo ""
    echo "如需启用认证，请参考: docs/AUTH_GUIDE.md"
    echo "如需批量导入，请参考: docs/BATCH_IMPORT_GUIDE.md"
    exit 0
else
    echo -e "${RED}⚠️  有检查项未通过，请检查缺失的文件或内容${NC}"
    echo ""
    echo "可能的原因："
    echo "1. 文件未正确创建或保存"
    echo "2. 某些修改未提交"
    echo "3. 路径不正确"
    echo ""
    echo "请查看上面的详细信息进行修复"
    exit 1
fi
