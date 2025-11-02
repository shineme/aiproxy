# 前端认证功能使用指南

## 概述

前端认证系统已完整实现，包括登录页面、密码修改、自动Token管理等功能。

## 功能列表

### ✅ 已实现的功能

1. **登录页面** (`/login`)
   - 用户名密码登录
   - 自动保存Token到localStorage
   - 登录后自动跳转到仪表板
   - 显示错误提示信息

2. **自动认证检查**
   - 页面加载时检查认证是否启用
   - 自动从localStorage恢复Token
   - 未登录时自动跳转到登录页

3. **用户信息显示**
   - 顶部导航栏显示当前用户名
   - 修改密码按钮
   - 退出登录按钮

4. **密码修改功能**
   - 弹窗式修改界面
   - 验证原密码
   - 确认新密码一致性
   - 密码强度验证

5. **Token管理**
   - 自动在请求头中添加Token
   - Token过期自动跳转登录
   - 退出登录清理Token

## 使用流程

### 1. 首次启用认证

**步骤1：配置后端**
```bash
# 编辑 .env 文件
ENABLE_AUTH=True
SECRET_KEY="your-secure-random-key"
```

**步骤2：启动后端**
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**步骤3：初始化管理员账户**
```bash
curl -X POST "http://localhost:8000/api/admin/auth/init-admin?username=admin&password=admin123"
```

**步骤4：启动前端**
```bash
cd frontend
npm run dev
```

### 2. 登录系统

1. 访问 `http://localhost:3000`
2. 如果启用了认证，会自动跳转到 `/login`
3. 输入用户名和密码（默认：admin / admin123）
4. 点击"登录"按钮
5. 登录成功后自动跳转到仪表板

### 3. 修改密码

1. 登录后，点击顶部导航栏的"修改密码"按钮
2. 输入原密码
3. 输入新密码（至少6个字符）
4. 确认新密码
5. 点击"确认修改"

### 4. 退出登录

点击顶部导航栏的"退出登录"按钮，系统会：
- 清除本地保存的Token
- 清除请求头中的Authorization
- 跳转到登录页面

## 文件结构

```
frontend/src/
├── app/
│   └── login/
│       └── page.tsx              # 登录页面
├── components/
│   └── Layout.tsx                # 布局组件（包含认证UI）
└── lib/
    └── auth.ts                   # 认证服务
```

## API接口

### authService

位置：`frontend/src/lib/auth.ts`

```typescript
// 检查认证是否启用
await authService.checkAuthStatus()

// 登录
await authService.login(username, password)

// 退出登录
authService.logout()

// 获取当前用户信息
await authService.getCurrentUser()

// 修改密码
await authService.changePassword(oldPassword, newPassword)

// 初始化Token（从localStorage恢复）
authService.initToken()

// 获取Token
authService.getToken()
```

## 界面预览

### 登录页面
- 位置：`/login`
- 特点：
  - 简洁的登录表单
  - 错误提示
  - 首次使用说明
  - 记住登录状态

### 已登录状态
顶部导航栏显示：
- 用户名（带头像图标）
- 修改密码按钮
- 退出登录按钮

### 修改密码弹窗
- 验证原密码
- 输入新密码
- 确认新密码
- 实时错误提示

## 开发集成

### 在其他页面中使用认证

```typescript
import { authService } from '@/lib/auth'

// 检查是否已登录
const token = authService.getToken()
if (!token) {
  router.push('/login')
}

// 获取当前用户
const user = await authService.getCurrentUser()
console.log(user?.username)
```

### API请求自动带Token

Token会自动添加到所有API请求的请求头中：

```typescript
import apiClient from '@/lib/api'

// 自动包含 Authorization: Bearer <token>
const response = await apiClient.get('/api/admin/upstreams')
```

### 处理401错误

可以在`api.ts`中添加响应拦截器：

```typescript
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token过期或无效
      authService.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 配置选项

### 禁用认证（开发模式）

如果在开发环境想要禁用认证：

```bash
# .env
ENABLE_AUTH=False
```

前端会自动检测并跳过认证流程。

### Token有效期

默认Token有效期为7天，可在后端配置：

```bash
# .env
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7天
```

## 安全注意事项

1. **生产环境必须启用HTTPS**
   - Token通过网络传输，必须使用HTTPS加密

2. **修改默认密码**
   - 首次登录后立即修改密码

3. **定期更换密码**
   - 建议定期更换管理员密码

4. **不要暴露Token**
   - 不要在日志中记录Token
   - 不要在URL中传递Token

5. **生成强密钥**
   ```bash
   openssl rand -hex 32
   ```

## 常见问题

### Q: 如何重置密码？

A: 目前需要直接操作数据库或重新初始化管理员账户。

### Q: Token存储在哪里？

A: Token存储在浏览器的localStorage中，键名为`token`。

### Q: 多个标签页如何同步登录状态？

A: 由于Token存储在localStorage，多个标签页会共享登录状态。退出登录时需要刷新其他标签页。

### Q: 如何添加记住我功能？

A: 可以通过调整Token过期时间或使用Refresh Token实现。

### Q: 如何实现自动刷新Token？

A: 可以在Token即将过期时自动调用刷新接口（需要后端支持Refresh Token）。

## 下一步改进

以下功能可在后续版本中添加：

1. **Refresh Token机制**
   - 实现Token自动刷新
   - 延长用户会话时间

2. **多用户管理**
   - 支持创建多个管理员账户
   - 角色权限管理

3. **密码重置功能**
   - 邮箱验证码重置
   - 安全问题验证

4. **登录日志**
   - 记录登录历史
   - 显示最后登录时间和IP

5. **会话管理**
   - 显示活跃会话列表
   - 远程登出功能

6. **双因素认证**
   - OTP验证
   - 提高安全性

## 技术支持

如有问题，请查看：
- [认证系统后端指南](./AUTH_GUIDE.md)
- [环境变量配置](./.env.example)
- 项目Issue页面
