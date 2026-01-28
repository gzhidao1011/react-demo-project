#!/bin/bash

# 本地开发快速启动脚本
# 用途：快速启动所有开发服务

set -e

echo "🚀 启动本地开发环境..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 1. 启动基础设施服务
echo -e "${YELLOW}📦 启动基础设施服务（MySQL、Redis、Nacos）...${NC}"
docker-compose up -d mysql redis nacos sentinel

echo "⏳ 等待服务就绪..."
sleep 10

# 检查服务状态
echo -e "${GREEN}✅ 基础设施服务状态：${NC}"
docker-compose ps mysql redis nacos sentinel

echo ""
echo -e "${GREEN}✅ 基础设施服务已启动！${NC}"
echo ""
echo "📝 服务地址："
echo "  - MySQL: localhost:3306"
echo "  - Redis: localhost:6379"
echo "  - Nacos: http://localhost:8848/nacos (nacos/nacos)"
echo "  - Sentinel: http://localhost:8858"
echo ""
echo "⚠️  请在新终端窗口中启动后端和前端服务："
echo ""
echo "后端服务（终端 2）："
echo "  cd services/user-service"
echo "  mvn spring-boot:run"
echo ""
echo "前端服务（终端 3）："
echo "  pnpm dev"
echo "  或"
echo "  pnpm --filter @repo/web dev"
echo ""
