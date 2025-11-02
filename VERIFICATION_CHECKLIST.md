# 修复验证清单

本文档帮助您验证所有8个问题是否已正确修复。

## 🔍 文件完整性检查

### 后端文件
```bash
# 检查所有新增的后端文件
ls -la backend/app/api/auth.py
ls -la backend/app/core/auth.py
ls -la backend/app/models/admin_user.py
ls -la backend/app/schemas/auth.py
ls -la backend/app/api/batch.py

# 检查修改的文件
grep "ENABLE_PYTHON_SCRIPTS" backend/app/core/config.py
grep "auth" backend/app/main.py
grep "AdminUser" backend/app/models/__init__.py
```

### 前端文件
```bash
# 检查所有新增的前端文件
ls -la frontend/src/app/login/page.tsx
ls -la frontend/src/app/logs/page.tsx
ls -la frontend/src/lib/auth.ts

# 检查修改的文件
grep "keysApi" frontend/src/lib/api.ts
grep "authService" frontend/src/components/Layout.tsx
grep "handleSubmit" frontend/src/app/rules/page.tsx
```

### 文档文件
```bash
# 检查所有文档
ls -la .env.example
ls -la docs/AUTH_GUIDE.md
ls -la docs/BATCH_IMPORT_GUIDE.md
ls -la docs/FRONTEND_AUTH_GUIDE.md
ls -la ISSUES_FIXED.md
```

## ✅ 功能验证步骤

### 问题 1 & 3：上游选择功能
```bash
# 1. 启动后端
cd backend
python -m uvicorn app.main:app --reload

# 2. 创建测试上游
curl -X POST "http://localhost:8000/api/admin/upstreams" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试钢厂",
    "base_url": "https://api.example.com"
  }'

# 3. 在浏览器中打开 http://localhost:3000/keys
# 4. 点击"添加密钥"，检查上游下拉框是否显示"测试钢厂"
```

### 问题 2：批量导入功能
```bash
# 测试 TXT 导入
echo "sk-test123" > test_keys.txt
echo "Key2:sk-test456" >> test_keys.txt

curl -X POST "http://localhost:8000/api/admin/batch/keys/import-txt?upstream_id=1" \
  -F "file=@test_keys.txt"

# 获取 CURL 示例
curl "http://localhost:8000/api/admin/batch/examples/curl"

# 测试 JSON 导入
curl -X POST "http://localhost:8000/api/admin/batch/keys/import-json" \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 1,
    "keys": [
      {
        "name": "测试密钥",
        "key_value": "sk-xxxxxxxxxx"
      }
    ]
  }'
```

### 问题 4：规则配置
```bash
# 在浏览器中打开 http://localhost:3000/rules
# 点击"+ 新增规则"按钮
# 填写表单并提交，检查是否能成功创建
```

### 问题 5：Logs 页面
```bash
# 在浏览器中打开 http://localhost:3000/logs
# 检查页面是否正常显示
# 测试筛选功能
```

### 问题 6：脚本执行
```bash
# 测试 JavaScript 脚本
curl -X POST "http://localhost:8000/api/admin/scripts/test" \
  -H "Content-Type: application/json" \
  -d '{
    "script_type": "javascript",
    "script_content": "return new Date().toISOString();"
  }'

# 测试 Python 脚本（需要先启用）
# 1. 安装依赖：pip install RestrictedPython
# 2. 修改 .env：ENABLE_PYTHON_SCRIPTS=True
# 3. 重启后端
curl -X POST "http://localhost:8000/api/admin/scripts/test" \
  -H "Content-Type: application/json" \
  -d '{
    "script_type": "python",
    "script_content": "from datetime import datetime\nresult = datetime.now().isoformat()"
  }'
```

### 问题 7：认证系统
```bash
# 1. 启用认证
echo "ENABLE_AUTH=True" >> backend/.env
echo "SECRET_KEY=$(openssl rand -hex 32)" >> backend/.env

# 2. 重启后端
cd backend
python -m uvicorn app.main:app --reload

# 3. 初始化管理员
curl -X POST "http://localhost:8000/api/admin/auth/init-admin?username=admin&password=admin123"

# 4. 测试登录
curl -X POST "http://localhost:8000/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 5. 在浏览器中访问 http://localhost:3000
# 应该自动跳转到登录页

# 6. 登录后测试修改密码功能
```

### 问题 8：.env.example
```bash
# 查看 .env.example 文件
cat .env.example

# 创建实际的 .env 文件
cp .env.example backend/.env

# 编辑配置
nano backend/.env
```

## 🐛 常见问题排查

### 问题：前端页面显示不了
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 16

# 重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install

# 重新启动
npm run dev
```

### 问题：后端 API 报错
```bash
# 检查 Python 版本
python --version  # 应该 >= 3.8

# 重新安装依赖
cd backend
pip install -r requirements.txt

# 检查数据库
python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

### 问题：上游选择框为空
```bash
# 1. 检查是否有上游数据
curl "http://localhost:8000/api/admin/upstreams"

# 2. 如果为空，创建测试数据
curl -X POST "http://localhost:8000/api/admin/upstreams" \
  -H "Content-Type: application/json" \
  -d '{"name": "测试上游", "base_url": "https://api.test.com"}'

# 3. 刷新前端页面
```

### 问题：认证后 API 调用失败
```bash
# 检查 Token 是否正确设置
# 在浏览器控制台执行：
localStorage.getItem('token')

# 检查请求头
# 在浏览器 Network 标签查看请求，应该包含：
# Authorization: Bearer <token>
```

## 📊 完整性报告

运行以下命令生成完整性报告：

```bash
#!/bin/bash
echo "=== 后端文件检查 ==="
[ -f backend/app/api/auth.py ] && echo "✅ auth.py" || echo "❌ auth.py"
[ -f backend/app/core/auth.py ] && echo "✅ core/auth.py" || echo "❌ core/auth.py"
[ -f backend/app/models/admin_user.py ] && echo "✅ admin_user.py" || echo "❌ admin_user.py"
[ -f backend/app/schemas/auth.py ] && echo "✅ schemas/auth.py" || echo "❌ schemas/auth.py"

echo -e "\n=== 前端文件检查 ==="
[ -f frontend/src/app/login/page.tsx ] && echo "✅ login/page.tsx" || echo "❌ login/page.tsx"
[ -f frontend/src/app/logs/page.tsx ] && echo "✅ logs/page.tsx" || echo "❌ logs/page.tsx"
[ -f frontend/src/lib/auth.ts ] && echo "✅ auth.ts" || echo "❌ auth.ts"

echo -e "\n=== 文档文件检查 ==="
[ -f .env.example ] && echo "✅ .env.example" || echo "❌ .env.example"
[ -f docs/AUTH_GUIDE.md ] && echo "✅ AUTH_GUIDE.md" || echo "❌ AUTH_GUIDE.md"
[ -f docs/BATCH_IMPORT_GUIDE.md ] && echo "✅ BATCH_IMPORT_GUIDE.md" || echo "❌ BATCH_IMPORT_GUIDE.md"
[ -f ISSUES_FIXED.md ] && echo "✅ ISSUES_FIXED.md" || echo "❌ ISSUES_FIXED.md"

echo -e "\n=== 配置检查 ==="
grep -q "ENABLE_PYTHON_SCRIPTS" backend/app/core/config.py && echo "✅ ENABLE_PYTHON_SCRIPTS 配置" || echo "❌ 配置缺失"
grep -q "auth.router" backend/app/main.py && echo "✅ auth router 注册" || echo "❌ router 未注册"
grep -q "AdminUser" backend/app/models/__init__.py && echo "✅ AdminUser 导出" || echo "❌ 模型未导出"
```

将以上脚本保存为 `check_completeness.sh` 并运行：
```bash
chmod +x check_completeness.sh
./check_completeness.sh
```

## 🎯 最终验证

完成所有修复后，按以下顺序进行最终验证：

1. ✅ 启动后端服务无错误
2. ✅ 启动前端服务无错误  
3. ✅ 访问所有页面都能正常打开
4. ✅ 创建上游、密钥、规则等功能正常
5. ✅ 批量导入功能正常工作
6. ✅ 脚本测试功能正常
7. ✅ 认证登录功能正常
8. ✅ 日志页面正常显示

## 📞 技术支持

如果遇到任何问题：

1. 查看详细文档：
   - `docs/AUTH_GUIDE.md` - 认证系统指南
   - `docs/BATCH_IMPORT_GUIDE.md` - 批量导入指南
   - `docs/FRONTEND_AUTH_GUIDE.md` - 前端认证指南
   - `ISSUES_FIXED.md` - 问题修复总结

2. 检查日志：
   - 后端：终端输出
   - 前端：浏览器控制台 (F12)

3. 验证环境：
   - Python >= 3.8
   - Node.js >= 16
   - 所有依赖已安装

4. 数据库状态：
   ```bash
   # 查看数据库文件
   ls -la backend/api_gateway.db
   
   # 如果需要重置
   rm backend/api_gateway.db
   # 重启后端会自动创建新数据库
   ```
