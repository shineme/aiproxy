# 部署方案

本文档提供 API Gateway Pro 的完整部署方案。

---

## 📋 部署前检查清单

### 功能完成度
- ⚠️ **当前状态**: 仅基础架构完成，核心功能未实现
- ⚠️ **建议**: 完成核心代理功能后再部署到生产环境
- ✅ **可用于**: 开发环境、演示环境、测试环境

### 环境要求
- [ ] Python 3.10+
- [ ] Node.js 18+
- [ ] PostgreSQL 14+ (生产环境推荐)
- [ ] Redis (可选，用于缓存和会话)
- [ ] Nginx (反向代理)
- [ ] SSL证书 (生产环境必需)

---

## 🚀 部署方式

### 方式一：Docker Compose (推荐)

适合：快速部署、开发测试、小规模生产

#### 1. 准备配置文件

创建生产环境配置：

```bash
# 创建生产环境 docker-compose 文件
cp docker-compose.yml docker-compose.prod.yml
```

编辑 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  db:
    image: postgres:15-alpine
    container_name: api-gateway-db
    environment:
      POSTGRES_DB: api_gateway_pro
      POSTGRES_USER: api_gateway_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - api-gateway-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U api_gateway_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (可选)
  redis:
    image: redis:7-alpine
    container_name: api-gateway-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - api-gateway-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 后端
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: api-gateway-backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://api_gateway_user:${DB_PASSWORD}@db:5432/api_gateway_pro
      - SECRET_KEY=${SECRET_KEY}
      - ENABLE_AUTH=true
      - LOG_LEVEL=INFO
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - api-gateway-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 前端
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    container_name: api-gateway-frontend
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - api-gateway-network
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: api-gateway-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - api-gateway-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  api-gateway-network:
    driver: bridge
```

#### 2. 创建环境变量文件

```bash
# .env.prod
DB_PASSWORD=your_strong_db_password_here
REDIS_PASSWORD=your_strong_redis_password_here
SECRET_KEY=your_very_long_random_secret_key_at_least_32_chars
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

#### 3. 创建生产 Dockerfile

**backend/Dockerfile.prod**:
```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-"]
```

**frontend/Dockerfile.prod**:
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

CMD ["node", "server.js"]
```

#### 4. 创建 Nginx 配置

**nginx/nginx.conf**:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP -> HTTPS 重定向
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 10M;

        # API 后端
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # API 文档
        location /docs {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /redoc {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend;
        }

        # 前端应用
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Next.js 特殊路由
        location /_next/ {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
        }
    }
}
```

#### 5. 部署步骤

```bash
# 1. 克隆代码
git clone <repository-url>
cd api-gateway-pro

# 2. 配置环境变量
cp .env.example .env.prod
# 编辑 .env.prod，设置强密码和密钥

# 3. 生成 SSL 证书 (使用 Let's Encrypt)
# 或者将证书放到 nginx/ssl/ 目录

# 4. 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 5. 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 6. 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

#### 6. 数据库迁移

```bash
# 进入后端容器
docker exec -it api-gateway-backend bash

# 运行迁移 (如果使用 Alembic)
# alembic upgrade head

# 或者，数据库会自动创建表（当前实现）
```

---

### 方式二：传统部署 (VPS/云服务器)

适合：需要更多控制、大规模部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm postgresql nginx certbot python3-certbot-nginx

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. 数据库设置

```bash
# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE api_gateway_pro;
CREATE USER api_gateway_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE api_gateway_pro TO api_gateway_user;
\q
EOF
```

#### 3. 后端部署

```bash
# 创建应用目录
sudo mkdir -p /opt/api-gateway-pro
sudo chown $USER:$USER /opt/api-gateway-pro
cd /opt/api-gateway-pro

# 克隆代码
git clone <repository-url> .

# 后端设置
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# 配置环境
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://api_gateway_user:your_password@localhost/api_gateway_pro
SECRET_KEY=$(openssl rand -hex 32)
ENABLE_AUTH=true
LOG_LEVEL=INFO
EOF

# 创建 systemd 服务
sudo tee /etc/systemd/system/api-gateway-backend.service << EOF
[Unit]
Description=API Gateway Pro Backend
After=network.target postgresql.service

[Service]
Type=notify
User=$USER
WorkingDirectory=/opt/api-gateway-pro/backend
Environment="PATH=/opt/api-gateway-pro/backend/venv/bin"
ExecStart=/opt/api-gateway-pro/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start api-gateway-backend
sudo systemctl enable api-gateway-backend
```

#### 4. 前端部署

```bash
cd /opt/api-gateway-pro/frontend

# 安装依赖
npm install

# 构建
NEXT_PUBLIC_API_URL=https://yourdomain.com npm run build

# 使用 PM2 管理
sudo npm install -g pm2
pm2 start npm --name "api-gateway-frontend" -- start
pm2 save
pm2 startup
```

#### 5. Nginx 配置

```bash
# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/api-gateway-pro << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/api-gateway-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 配置 SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com
```

---

### 方式三：Kubernetes (K8s)

适合：大规模、高可用、微服务架构

#### 部署清单示例

**kubernetes/namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: api-gateway-pro
```

**kubernetes/configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-gateway-config
  namespace: api-gateway-pro
data:
  LOG_LEVEL: "INFO"
  ENABLE_AUTH: "true"
```

**kubernetes/secrets.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-gateway-secrets
  namespace: api-gateway-pro
type: Opaque
stringData:
  DB_PASSWORD: "your_db_password"
  SECRET_KEY: "your_secret_key"
  REDIS_PASSWORD: "your_redis_password"
```

**kubernetes/backend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: api-gateway-pro
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/api-gateway-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql+asyncpg://user:$(DB_PASSWORD)@postgres:5432/api_gateway_pro"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: api-gateway-secrets
              key: SECRET_KEY
        envFrom:
        - configMapRef:
            name: api-gateway-config
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: api-gateway-pro
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

**kubernetes/ingress.yaml**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
  namespace: api-gateway-pro
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    secretName: api-gateway-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
```

---

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 生成强密钥
openssl rand -hex 32

# 使用环境变量管理工具
# - Docker Secrets
# - Kubernetes Secrets
# - HashiCorp Vault
# - AWS Secrets Manager
```

### 2. 数据库安全

```sql
-- 限制数据库用户权限
REVOKE ALL ON DATABASE api_gateway_pro FROM PUBLIC;
GRANT CONNECT ON DATABASE api_gateway_pro TO api_gateway_user;

-- 启用 SSL 连接
ALTER SYSTEM SET ssl = on;
```

### 3. API 安全

```python
# backend/.env
ENABLE_AUTH=true  # 启用认证
RATE_LIMIT_ENABLED=true  # 启用速率限制
ALLOWED_HOSTS=["yourdomain.com"]  # 限制访问域名
```

### 4. 防火墙配置

```bash
# UFW 示例
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 📊 监控与日志

### 1. 应用监控

推荐工具：
- **Prometheus + Grafana** - 指标监控
- **ELK Stack** - 日志聚合
- **Sentry** - 错误追踪
- **Datadog / New Relic** - APM

### 2. 日志配置

```python
# backend/app/core/logging.py
import structlog

logger = structlog.get_logger()

# 输出到文件和 stdout
```

### 3. 健康检查

```bash
# 检查后端
curl http://localhost:8000/health

# 检查数据库连接
docker exec -it api-gateway-backend python -c "from app.core.database import engine; print('DB OK')"
```

---

## 🔄 CI/CD 配置

### GitHub Actions 示例

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and push Docker images
      run: |
        docker build -t your-registry/api-gateway-backend:latest ./backend
        docker build -t your-registry/api-gateway-frontend:latest ./frontend
        docker push your-registry/api-gateway-backend:latest
        docker push your-registry/api-gateway-frontend:latest
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /opt/api-gateway-pro
          git pull
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 维护与更新

### 1. 备份

```bash
# 数据库备份
pg_dump -U api_gateway_user api_gateway_pro > backup_$(date +%Y%m%d).sql

# 定期备份脚本
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup-script.sh
```

### 2. 更新应用

```bash
# Docker 方式
cd /opt/api-gateway-pro
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# 传统方式
cd /opt/api-gateway-pro
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart api-gateway-backend
cd ../frontend && npm install && npm run build
pm2 restart api-gateway-frontend
```

### 3. 回滚

```bash
# Git 回滚
git checkout <previous-commit-hash>
docker-compose -f docker-compose.prod.yml up -d --build

# 数据库回滚
psql -U api_gateway_user api_gateway_pro < backup_YYYYMMDD.sql
```

---

## 📈 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX idx_api_keys_status ON api_keys(status);

-- 启用连接池
-- 在 DATABASE_URL 添加参数: ?pool_size=20&max_overflow=0
```

### 2. 应用优化

```python
# 增加 worker 数量
gunicorn app.main:app -w 8 -k uvicorn.workers.UvicornWorker

# 使用 Redis 缓存
# pip install redis
```

### 3. CDN 配置

- 使用 Cloudflare / AWS CloudFront
- 缓存静态资源
- 启用 HTTP/2 和 Brotli 压缩

---

## ✅ 部署后验证

### 检查清单

```bash
# 1. 服务运行状态
docker-compose ps  # 或 systemctl status api-gateway-*

# 2. 健康检查
curl https://yourdomain.com/health

# 3. API 测试
curl https://yourdomain.com/api/admin/upstreams

# 4. 前端访问
# 浏览器打开 https://yourdomain.com

# 5. 日志检查
docker-compose logs -f  # 或 journalctl -u api-gateway-*

# 6. 数据库连接
psql -U api_gateway_user -d api_gateway_pro -h localhost -c "SELECT 1"

# 7. SSL 证书
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 🆘 故障排查

### 常见问题

1. **容器无法启动**
   ```bash
   docker-compose logs <service-name>
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库是否运行
   docker exec -it api-gateway-db pg_isready
   ```

3. **端口冲突**
   ```bash
   # 查找占用端口的进程
   sudo lsof -i :8000
   ```

4. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R $USER:$USER /opt/api-gateway-pro
   ```

---

## 📞 支持

部署相关问题请查阅：
- [GETTING_STARTED.md](./GETTING_STARTED.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

**重要提示**: 当前项目仅完成基础架构，核心业务功能未实现。建议完成核心功能开发后再部署到生产环境。
