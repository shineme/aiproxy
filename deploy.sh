#!/bin/bash

# API Gateway Pro - 快速部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

MODE=${1:-dev}
ENV_FILE=".env"

echo "🚀 API Gateway Pro 部署脚本"
echo "================================"
echo "模式: $MODE"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker 环境检查通过${NC}"
}

# 检查环境变量
check_env() {
    if [ "$MODE" == "prod" ]; then
        ENV_FILE=".env.prod"
        if [ ! -f "$ENV_FILE" ]; then
            echo -e "${RED}❌ 未找到 $ENV_FILE 文件${NC}"
            echo "请创建生产环境配置文件"
            exit 1
        fi
    else
        if [ ! -f "backend/.env" ]; then
            echo -e "${YELLOW}⚠ 未找到 backend/.env，从示例创建...${NC}"
            cp backend/.env.example backend/.env
        fi
    fi
    echo -e "${GREEN}✓ 环境配置检查通过${NC}"
}

# 停止现有服务
stop_services() {
    echo "🛑 停止现有服务..."
    if [ "$MODE" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    else
        docker-compose down 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ 服务已停止${NC}"
}

# 构建镜像
build_images() {
    echo "🔨 构建 Docker 镜像..."
    if [ "$MODE" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build
    fi
    echo -e "${GREEN}✓ 镜像构建完成${NC}"
}

# 启动服务
start_services() {
    echo "🚀 启动服务..."
    if [ "$MODE" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    echo -e "${GREEN}✓ 服务已启动${NC}"
}

# 等待服务就绪
wait_for_services() {
    echo "⏳ 等待服务就绪..."
    sleep 5
    
    # 检查后端
    for i in {1..30}; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            echo -e "${GREEN}✓ 后端服务就绪${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ 后端服务启动超时${NC}"
            exit 1
        fi
        sleep 2
    done
    
    # 检查前端
    for i in {1..30}; do
        if curl -f http://localhost:3000 &> /dev/null; then
            echo -e "${GREEN}✓ 前端服务就绪${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ 前端服务启动超时${NC}"
            exit 1
        fi
        sleep 2
    done
}

# 显示状态
show_status() {
    echo ""
    echo "================================"
    echo "📊 服务状态"
    echo "================================"
    
    if [ "$MODE" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker-compose ps
    fi
    
    echo ""
    echo "================================"
    echo "🌐 访问地址"
    echo "================================"
    echo "后端 API:    http://localhost:8000"
    echo "API 文档:    http://localhost:8000/docs"
    echo "前端界面:    http://localhost:3000"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
    echo ""
}

# 主流程
main() {
    echo "开始部署流程..."
    echo ""
    
    check_docker
    check_env
    stop_services
    
    if [ "$MODE" == "prod" ]; then
        echo -e "${YELLOW}⚠ 生产模式部署${NC}"
        read -p "确认继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "取消部署"
            exit 1
        fi
    fi
    
    build_images
    start_services
    wait_for_services
    show_status
    
    echo -e "${GREEN}🎉 部署完成！${NC}"
}

# 帮助信息
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "使用方法:"
    echo "  ./deploy.sh          # 开发环境部署"
    echo "  ./deploy.sh dev      # 开发环境部署"
    echo "  ./deploy.sh prod     # 生产环境部署"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    exit 0
fi

# 执行主流程
main
