# 身份认证系统使用指南

本指南介绍如何启用和使用身份认证功能。

## 目录

1. [快速开始](#快速开始)
2. [启用认证](#启用认证)
3. [初始化管理员账户](#初始化管理员账户)
4. [登录系统](#登录系统)
5. [修改密码](#修改密码)
6. [API使用](#api使用)

---

## 快速开始

### 1. 启用认证

编辑 `.env` 文件：

```bash
ENABLE_AUTH=True
```

### 2. 重启服务

```bash
# 停止当前服务
# 启动服务
cd backend
python -m uvicorn app.main:app --reload
```

### 3. 初始化管理员账户

```bash
curl -X POST "http://localhost:8000/api/admin/auth/init-admin?username=admin&password=your_secure_password"
```

### 4. 获取Token

```bash
curl -X POST "http://localhost:8000/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password"
  }'
```

响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 5. 使用Token访问API

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/admin/upstreams"
```

---

## 启用认证

### 配置说明

在 `.env` 文件中设置：

```bash
# 是否启用身份认证
ENABLE_AUTH=True

# JWT密钥（必须修改为强随机密钥）
SECRET_KEY="your-secret-key-change-this-in-production"

# JWT加密算法
ALGORITHM="HS256"

# Token过期时间（分钟）默认7天
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 生成安全的SECRET_KEY

```bash
# 使用openssl生成32字节随机密钥
openssl rand -hex 32
```

将生成的密钥设置到 `.env` 文件的 `SECRET_KEY` 变量中。

---

## 初始化管理员账户

### 首次使用

系统首次启用认证时，需要创建管理员账户：

```bash
curl -X POST "http://localhost:8000/api/admin/auth/init-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

或使用URL参数：

```bash
curl -X POST "http://localhost:8000/api/admin/auth/init-admin?username=admin&password=admin123"
```

### 注意事项

1. **仅在没有管理员账户时可用**：如果已存在管理员账户，此接口会返回错误
2. **密码强度**：建议使用强密码（至少8位，包含大小写字母、数字、特殊字符）
3. **首次设置后立即修改**：建议初始化后立即修改为更安全的密码

---

## 登录系统

### 登录请求

```bash
curl -X POST "http://localhost:8000/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

### 成功响应

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTcwNDY3MjAwMH0.xxxxx",
  "token_type": "bearer"
}
```

### 失败响应

```json
{
  "detail": "用户名或密码错误"
}
```

### Token有效期

- 默认有效期：7天 (10080分钟)
- 可通过 `ACCESS_TOKEN_EXPIRE_MINUTES` 配置修改
- Token过期后需要重新登录

---

## 修改密码

### 请求示例

```bash
curl -X POST "http://localhost:8000/api/admin/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "old_password": "current_password",
    "new_password": "new_secure_password"
  }'
```

### 密码要求

- 最小长度：6个字符
- 建议：至少8位，包含大小写字母、数字、特殊字符

### 成功响应

```json
{
  "message": "密码修改成功"
}
```

### 注意事项

- 修改密码后，旧Token仍然有效直到过期
- 建议修改密码后重新登录获取新Token

---

## API使用

### 获取当前用户信息

```bash
curl -X GET "http://localhost:8000/api/admin/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应：
```json
{
  "id": 1,
  "username": "admin",
  "is_active": true
}
```

### 检查认证状态

```bash
curl "http://localhost:8000/api/admin/auth/status"
```

响应：
```json
{
  "enabled": true,
  "message": "认证已启用"
}
```

---

## 在应用中使用Token

### JavaScript/TypeScript示例

```typescript
import axios from 'axios'

// 设置默认请求头
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 登录
async function login(username: string, password: string) {
  const response = await apiClient.post('/api/admin/auth/login', {
    username,
    password
  })
  
  const token = response.data.access_token
  
  // 保存Token
  localStorage.setItem('token', token)
  
  // 设置后续请求的认证头
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  
  return token
}

// 使用Token访问受保护的API
async function fetchUpstreams() {
  const token = localStorage.getItem('token')
  
  const response = await apiClient.get('/api/admin/upstreams', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return response.data
}
```

### Python示例

```python
import requests

BASE_URL = "http://localhost:8000"

# 登录
def login(username, password):
    response = requests.post(
        f"{BASE_URL}/api/admin/auth/login",
        json={"username": username, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

# 使用Token访问API
def get_upstreams(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/admin/upstreams",
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# 使用示例
token = login("admin", "your_password")
upstreams = get_upstreams(token)
print(upstreams)
```

---

## 安全最佳实践

1. **强密钥**
   - 使用 `openssl rand -hex 32` 生成SECRET_KEY
   - 不要使用默认值

2. **强密码**
   - 最少8位字符
   - 包含大小写字母、数字、特殊字符
   - 定期更换密码

3. **HTTPS**
   - 生产环境必须使用HTTPS
   - 防止Token被中间人攻击窃取

4. **Token管理**
   - 安全存储Token（不要暴露在日志中）
   - Token过期后及时清理
   - 不要在URL中传递Token

5. **定期更新**
   - 定期更换SECRET_KEY（需重新登录）
   - 设置合理的Token过期时间

6. **监控**
   - 监控异常登录尝试
   - 记录认证失败日志

---

## 禁用认证

### 开发环境

如果在开发环境中想要禁用认证：

```bash
# .env
ENABLE_AUTH=False
```

重启服务后，所有API将无需认证即可访问。

### 注意事项

- **生产环境强烈建议启用认证**
- 禁用认证后，任何人都可以访问管理接口
- 仅在可信任的网络环境中禁用认证

---

## 常见问题

### Q: 忘记密码怎么办？

A: 目前需要直接操作数据库重置密码。后续版本会添加密码重置功能。

临时方案：
```python
from app.core.auth import get_password_hash
# 生成新密码的哈希
print(get_password_hash("new_password"))
# 然后在数据库中更新 admin_users 表的 hashed_password 字段
```

### Q: Token过期了怎么办？

A: 重新登录获取新Token。

### Q: 可以同时使用多个Token吗？

A: 可以。每次登录都会生成新Token，旧Token在过期前仍然有效。

### Q: 如何让Token立即失效？

A: 目前没有Token撤销功能。可以通过修改SECRET_KEY使所有Token失效（需要所有用户重新登录）。

### Q: 可以创建多个管理员账户吗？

A: 当前版本仅支持单个管理员账户。多用户支持将在后续版本中添加。

---

## 技术支持

如有问题，请查看项目文档或提交Issue。
