# 使用示例

本文档提供 API Gateway Pro 的实际使用示例。

---

## 🚀 快速开始示例

### 1. 启动服务

```bash
# 方式一：使用 Docker (推荐)
./deploy.sh dev

# 方式二：手动启动
cd backend && ./run.sh
cd frontend && npm run dev
```

---

## 📝 API 使用示例

### 1. 创建上游 API

```bash
curl -X POST http://localhost:8000/api/admin/upstreams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openai",
    "base_url": "https://api.openai.com",
    "description": "OpenAI API",
    "timeout": 60,
    "retry_count": 2,
    "log_request_body": false,
    "log_response_body": false,
    "is_enabled": true
  }'
```

**响应示例**:
```json
{
  "id": 1,
  "name": "openai",
  "base_url": "https://api.openai.com",
  "description": "OpenAI API",
  "proxy_path_prefix": "/proxy",
  "timeout": 60,
  "retry_count": 2,
  "connection_pool_size": 10,
  "log_request_body": false,
  "log_response_body": false,
  "tags": [],
  "is_enabled": true,
  "created_at": "2025-11-02T10:00:00Z",
  "updated_at": null
}
```

### 2. 添加 API 密钥

```bash
curl -X POST http://localhost:8000/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 1,
    "name": "OpenAI Key 1",
    "key_value": "sk-xxxxxxxxxxxxxxxxxxxxx",
    "location": "header",
    "param_name": "Authorization",
    "value_prefix": "Bearer ",
    "enable_quota": true,
    "quota_total": 1000,
    "auto_disable_on_failure": true,
    "auto_enable_delay_hours": 24
  }'
```

**响应示例**:
```json
{
  "id": 1,
  "upstream_id": 1,
  "name": "OpenAI Key 1",
  "key_value": "sk-xxxxxxxxxxxxxxxxxxxxx",
  "location": "header",
  "param_name": "Authorization",
  "value_prefix": "Bearer ",
  "status": "active",
  "enable_quota": true,
  "quota_total": 1000,
  "quota_used": 0,
  "quota_reset_at": null,
  "auto_disable_on_failure": true,
  "auto_enable_delay_hours": 24,
  "auto_enable_at": null,
  "last_used_at": null,
  "created_at": "2025-11-02T10:05:00Z",
  "updated_at": null
}
```

### 3. 创建失效规则

```bash
curl -X POST http://localhost:8000/api/admin/rules \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 1,
    "name": "检测配额用尽",
    "description": "当返回配额用尽错误时自动禁用密钥",
    "conditions": {
      "type": "composite",
      "logic": "OR",
      "conditions": [
        {
          "type": "status_code",
          "operator": "equals",
          "value": 429
        },
        {
          "type": "response_body",
          "operator": "contains",
          "value": "quota exceeded"
        }
      ]
    },
    "actions": ["disable_key", "log"],
    "auto_enable_delay_hours": 24,
    "trigger_threshold": 1,
    "is_enabled": true
  }'
```

### 4. 使用代理转发请求

**示例 1: 转发到 OpenAI**

```bash
curl -X POST http://localhost:8000/proxy/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**系统会自动**:
1. 选择一个可用的 API 密钥
2. 将请求转发到 `https://api.openai.com/v1/chat/completions`
3. 自动添加 `Authorization: Bearer sk-xxxxx` 头
4. 检查响应是否触发失效规则
5. 记录请求日志
6. 返回响应

**示例 2: 转发到其他 API**

```bash
# 假设已创建名为 'github' 的上游
curl http://localhost:8000/proxy/github/user \
  -H "Accept: application/json"
```

### 5. 查看请求日志

```bash
# 获取最近的日志
curl http://localhost:8000/api/admin/logs?limit=10

# 获取特定上游的日志
curl http://localhost:8000/api/admin/logs?upstream_id=1&limit=20

# 获取日志统计
curl http://localhost:8000/api/admin/logs/stats/summary?days=7
```

**响应示例**:
```json
{
  "total_requests": 1523,
  "successful_requests": 1498,
  "success_rate": 98.36,
  "average_latency_ms": 245.67
}
```

### 6. 查看仪表板数据

```bash
# 获取关键指标
curl http://localhost:8000/api/admin/dashboard/stats
```

**响应示例**:
```json
{
  "today_requests": 342,
  "success_rate": 98.5,
  "active_keys": 5,
  "total_keys": 8,
  "average_latency_ms": 198.23
}
```

```bash
# 获取实时请求数据
curl http://localhost:8000/api/admin/dashboard/realtime?limit=20
```

---

## 🔧 规则配置示例

### 示例 1: 检测状态码 401 (认证失败)

```json
{
  "name": "检测认证失败",
  "upstream_id": 1,
  "conditions": {
    "type": "status_code",
    "operator": "equals",
    "value": 401
  },
  "actions": ["ban_key", "alert"],
  "is_enabled": true
}
```

### 示例 2: 检测速率限制

```json
{
  "name": "检测速率限制",
  "upstream_id": 1,
  "conditions": {
    "type": "composite",
    "logic": "AND",
    "conditions": [
      {
        "type": "status_code",
        "operator": "equals",
        "value": 429
      },
      {
        "type": "response_header",
        "header_name": "X-RateLimit-Remaining",
        "operator": "equals",
        "value": "0"
      }
    ]
  },
  "actions": ["disable_key"],
  "auto_enable_delay_hours": 1,
  "is_enabled": true
}
```

### 示例 3: 检测响应错误信息

```json
{
  "name": "检测无效密钥",
  "upstream_id": 1,
  "conditions": {
    "type": "response_body",
    "operator": "regex",
    "value": "invalid.*api.*key"
  },
  "actions": ["ban_key", "alert"],
  "is_enabled": true
}
```

### 示例 4: 检测慢请求

```json
{
  "name": "检测慢请求",
  "upstream_id": 1,
  "conditions": {
    "type": "latency",
    "operator": "greater_than",
    "value": 5000
  },
  "actions": ["log", "alert"],
  "trigger_threshold": 3,
  "time_window_seconds": 60,
  "is_enabled": true
}
```

---

## 🔑 密钥管理示例

### 1. 批量导入密钥

```python
import requests

keys_data = [
    {
        "upstream_id": 1,
        "name": f"Key {i}",
        "key_value": f"sk-key{i}xxxxxxxxxx",
        "location": "header",
        "param_name": "Authorization",
        "value_prefix": "Bearer ",
        "enable_quota": True,
        "quota_total": 1000
    }
    for i in range(1, 11)
]

for key_data in keys_data:
    response = requests.post(
        "http://localhost:8000/api/admin/keys",
        json=key_data
    )
    print(f"Created key: {response.json()['id']}")
```

### 2. 手动禁用密钥

```bash
curl -X POST http://localhost:8000/api/admin/keys/1/disable
```

### 3. 手动启用密钥

```bash
curl -X POST http://localhost:8000/api/admin/keys/1/enable
```

### 4. 更新密钥配额

```bash
curl -X PUT http://localhost:8000/api/admin/keys/1 \
  -H "Content-Type: application/json" \
  -d '{
    "quota_total": 2000,
    "quota_used": 0
  }'
```

---

## 📊 监控示例

### 1. Python 脚本监控

```python
import requests
import time

def monitor_gateway():
    """监控网关状态"""
    while True:
        try:
            # 获取统计数据
            stats = requests.get("http://localhost:8000/api/admin/dashboard/stats").json()
            
            print(f"今日请求: {stats['today_requests']}")
            print(f"成功率: {stats['success_rate']}%")
            print(f"活跃密钥: {stats['active_keys']}/{stats['total_keys']}")
            print(f"平均延迟: {stats['average_latency_ms']}ms")
            print("-" * 50)
            
            # 检查成功率
            if stats['success_rate'] < 95:
                print("⚠️ 警告: 成功率低于 95%")
            
            # 检查活跃密钥
            if stats['active_keys'] < 2:
                print("⚠️ 警告: 可用密钥不足")
            
            time.sleep(60)
            
        except Exception as e:
            print(f"监控失败: {e}")
            time.sleep(10)

if __name__ == "__main__":
    monitor_gateway()
```

### 2. 导出日志分析

```bash
# 导出最近7天的日志
curl "http://localhost:8000/api/admin/logs?limit=10000" > logs.json

# 使用 jq 分析
cat logs.json | jq '[.[] | select(.status_code >= 400)] | length'  # 错误数量
cat logs.json | jq '[.[] | .latency_ms] | add / length'  # 平均延迟
```

---

## 🧪 测试示例

### 1. 测试代理转发

```bash
# 创建测试上游
curl -X POST http://localhost:8000/api/admin/upstreams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "httpbin",
    "base_url": "https://httpbin.org",
    "description": "HTTPBin 测试服务",
    "is_enabled": true
  }'

# 添加测试密钥（httpbin不需要真实密钥）
curl -X POST http://localhost:8000/api/admin/keys \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 2,
    "name": "Test Key",
    "key_value": "test-key-123",
    "location": "header",
    "param_name": "X-API-Key",
    "value_prefix": ""
  }'

# 测试 GET 请求
curl http://localhost:8000/proxy/httpbin/get

# 测试 POST 请求
curl -X POST http://localhost:8000/proxy/httpbin/post \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 测试延迟
curl http://localhost:8000/proxy/httpbin/delay/2
```

### 2. 测试规则触发

```bash
# 创建测试规则（检测404）
curl -X POST http://localhost:8000/api/admin/rules \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 2,
    "name": "检测404错误",
    "conditions": {
      "type": "status_code",
      "operator": "equals",
      "value": 404
    },
    "actions": ["log"],
    "is_enabled": true
  }'

# 触发规则
curl http://localhost:8000/proxy/httpbin/status/404

# 查看日志确认规则被触发
curl "http://localhost:8000/api/admin/logs?limit=1" | jq '.[0].triggered_rules'
```

---

## 💡 高级用法

### 1. 自定义请求头

```bash
# 创建静态请求头
curl -X POST http://localhost:8000/api/admin/headers \
  -H "Content-Type: application/json" \
  -d '{
    "upstream_id": 1,
    "header_name": "X-Custom-Header",
    "value_type": "static",
    "static_value": "custom-value",
    "is_enabled": true
  }'
```

### 2. 密钥轮询策略

```python
# 在代理服务中可以指定策略
# 策略支持: round_robin, random, weighted

# round_robin: 轮询（默认）
# random: 随机选择
# weighted: 根据剩余配额加权选择
```

### 3. 配额自动重置

```bash
# 设置每日配额重置
curl -X PUT http://localhost:8000/api/admin/keys/1 \
  -H "Content-Type: application/json" \
  -d '{
    "enable_quota": true,
    "quota_total": 1000,
    "quota_reset_at": "2025-11-03T00:00:00Z"
  }'
```

---

## 🔍 故障排查示例

### 1. 检查服务状态

```bash
# 健康检查
curl http://localhost:8000/health

# 查看服务信息
curl http://localhost:8000/
```

### 2. 查看错误日志

```bash
# 查看有错误的请求
curl "http://localhost:8000/api/admin/logs?limit=100" | jq '[.[] | select(.error_message != null)]'
```

### 3. 检查密钥状态

```bash
# 查看所有密钥
curl http://localhost:8000/api/admin/keys | jq '.[] | {id, name, status, quota_used, quota_total}'

# 查看被禁用的密钥
curl "http://localhost:8000/api/admin/keys?status=disabled"
```

---

## 📚 更多资源

- [API 文档](http://localhost:8000/docs) - 交互式 API 文档
- [开发指南](./DEVELOPMENT.md) - 开发者文档
- [部署指南](./DEPLOYMENT.md) - 部署说明
- [快速参考](./QUICKREF.md) - 常用命令

---

**提示**: 所有示例都假设服务运行在 `http://localhost:8000`。如果你的服务运行在其他地址，请相应修改 URL。
