# API密钥批量导入指南

本指南介绍如何使用批量导入功能快速添加大量API密钥。

## 目录

1. [JSON格式导入](#json格式导入)
2. [TXT文件导入](#txt文件导入)
3. [CSV文件导入](#csv文件导入)
4. [获取CURL示例](#获取curl示例)

---

## JSON格式导入

### 适用场景
通过API调用批量导入密钥，适合程序化集成。

### CURL示例

```bash
curl -X POST "http://localhost:8000/api/admin/batch/keys/import-json" \
  -H "Content-Type: application/json" \
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
  }'
```

### 参数说明

- `upstream_id`: 上游API的ID（必填）
- `keys`: 密钥数组
  - `name`: 密钥名称（可选）
  - `key_value`: 密钥值（必填）
  - `location`: 密钥位置，可选值：`header`, `query`, `body`（默认：`header`）
  - `param_name`: 参数名称（默认：`Authorization`）
  - `value_prefix`: 值前缀（默认：`Bearer `）
  - `enable_quota`: 是否启用配额（默认：`false`）
  - `quota_total`: 配额总量（当`enable_quota`为`true`时必填）

### 响应示例

```json
{
  "success_count": 2,
  "failed_count": 0,
  "errors": []
}
```

---

## TXT文件导入

### 适用场景
从文本文件批量导入密钥，每行一个密钥，简单快捷。

### 文件格式

支持两种格式：

**格式1：纯密钥值**
```
sk-xxxxxxxxxx
sk-yyyyyyyyyy
sk-zzzzzzzzzz
```

**格式2：名称:密钥值**
```
测试密钥1:sk-xxxxxxxxxx
测试密钥2:sk-yyyyyyyyyy
生产密钥1:sk-zzzzzzzzzz
```

### CURL示例

```bash
curl -X POST "http://localhost:8000/api/admin/batch/keys/import-txt?upstream_id=1" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@keys.txt"
```

### 参数说明

- `upstream_id`: 上游API的ID（必填，通过URL参数传递）
- `file`: TXT文件

### 注意事项

- 每行一个密钥
- 支持空行（会被自动忽略）
- 使用冒号(`:`)分隔名称和密钥值
- 默认设置：
  - location: `header`
  - param_name: `Authorization`
  - value_prefix: `Bearer `

---

## CSV文件导入

### 适用场景
需要导入包含完整配置的密钥，适合从Excel导出或其他系统迁移。

### 文件格式

```csv
upstream_id,name,key_value,location,param_name,value_prefix,enable_quota,quota_total
1,Key 1,sk-xxxxxxxxxx,header,Authorization,Bearer ,true,1000
1,Key 2,sk-yyyyyyyyyy,header,Authorization,Bearer ,true,1000
1,Key 3,sk-zzzzzzzzzz,header,Authorization,Bearer ,false,
```

### CURL示例

```bash
curl -X POST "http://localhost:8000/api/admin/batch/keys/import-csv" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@keys.csv"
```

### 下载CSV模板

```bash
curl -O "http://localhost:8000/api/admin/batch/template/keys-csv"
```

### 字段说明

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| upstream_id | 是 | 上游API的ID | 1 |
| name | 否 | 密钥名称 | "OpenAI Key 1" |
| key_value | 是 | 密钥值 | "sk-xxxxxxxxxx" |
| location | 否 | 密钥位置 | header/query/body |
| param_name | 否 | 参数名称 | "Authorization" |
| value_prefix | 否 | 值前缀 | "Bearer " |
| enable_quota | 否 | 是否启用配额 | true/false |
| quota_total | 否 | 配额总量 | 1000 |

---

## 获取CURL示例

访问以下API可以获取所有批量导入方式的CURL示例：

```bash
curl "http://localhost:8000/api/admin/batch/examples/curl"
```

返回包含所有导入方式的详细示例和说明。

---

## 批量操作API

### 批量更新密钥状态

```bash
curl -X POST "http://localhost:8000/api/admin/batch/keys/batch-update-status" \
  -H "Content-Type: application/json" \
  -d '{
    "key_ids": [1, 2, 3],
    "status": "active"
  }'
```

状态可选值：`active`, `disabled`, `banned`

### 批量删除密钥

```bash
curl -X DELETE "http://localhost:8000/api/admin/batch/keys/batch-delete" \
  -H "Content-Type: application/json" \
  -d '{
    "key_ids": [1, 2, 3]
  }'
```

### 导出密钥为CSV

```bash
# 导出所有密钥
curl -O "http://localhost:8000/api/admin/batch/keys/export-csv"

# 导出指定上游的密钥
curl -O "http://localhost:8000/api/admin/batch/keys/export-csv?upstream_id=1"
```

---

## 常见问题

### Q: 导入失败怎么办？

A: 检查响应中的 `errors` 数组，包含了每个失败行的详细错误信息。

### Q: 可以同时导入多个上游的密钥吗？

A: 
- JSON格式：不可以，一次只能导入一个上游的密钥
- CSV格式：可以，每行可以指定不同的 `upstream_id`
- TXT格式：不可以，需要通过 URL 参数指定上游

### Q: 导入的密钥默认状态是什么？

A: 默认状态为 `active`（活跃），可以立即使用。

### Q: 如何处理部分成功的导入？

A: 系统会返回 `success_count` 和 `failed_count`，已成功导入的密钥会保存，失败的密钥信息在 `errors` 数组中。

---

## 最佳实践

1. **小批量测试**：首次使用时先导入少量密钥测试
2. **备份数据**：导入前备份现有数据
3. **验证格式**：确保文件格式正确，可先下载模板
4. **错误处理**：检查返回的错误信息，修正后重新导入
5. **使用CSV**：需要完整配置时使用CSV格式
6. **使用TXT**：仅需导入密钥值时使用TXT格式
7. **使用JSON**：程序化集成时使用JSON格式

---

## 技术支持

如有问题，请查看项目文档或提交Issue。
