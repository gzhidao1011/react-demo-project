# 快速开始指南

本文档提供最简洁的本地开发启动步骤。

## 🚀 三步启动

### 1. 启动基础设施（Docker）

```bash
# 方式一：使用 npm 脚本（推荐）
pnpm dev:infra

# 方式二：使用 Docker Compose
docker-compose up -d mysql redis nacos sentinel

# 方式三：使用启动脚本
# Windows PowerShell
.\scripts\dev-start.ps1

# Linux/Mac
chmod +x scripts/dev-start.sh
./scripts/dev-start.sh
```

### 2. 启动后端服务（新终端）

**一键启动所有微服务**（需在 `services` 目录下执行，与前端区分，**无 Node.js 依赖**）：

```bash
cd services

make up    # 先启动基础设施
make dev   # 启动所有微服务
```

该命令会并行启动所有微服务：
- **API 网关**：http://localhost:8080
- **用户服务**：http://localhost:8001
- **订单服务**：http://localhost:8002

**简化启动**（API 网关自动拉起基础设施，无需先 `make up`）：

```bash
cd services
make gateway-compose   # 启动网关并自动拉起 MySQL、Redis、Nacos、Sentinel
# 然后在新终端：make user 和 make order
```

**单独启动某个服务**（可选）：

```bash
cd services
make user     # 或 mvn spring-boot:run -pl user-service
make order    # 或 mvn spring-boot:run -pl order-service
make gateway  # 或 mvn spring-boot:run -pl api-gateway
```

### 3. 启动前端服务（新终端）

```bash
# 从项目根目录
pnpm dev

# 或仅启动 web 应用
pnpm --filter @repo/web dev
```

**前端地址**：http://localhost:5173

## ✅ 验证

1. **访问前端**：http://localhost:5173
2. **检查后端健康**：
   - 用户服务：http://localhost:8001/actuator/health
   - 订单服务：http://localhost:8002/actuator/health
   - API 网关：http://localhost:8080/actuator/health
3. **检查 Nacos**：http://localhost:8848/nacos (nacos/nacos)

## 📝 服务端口

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端应用 | 5173 | http://localhost:5173 |
| API 网关 | 8080 | http://localhost:8080 |
| 用户服务 | 8001 | http://localhost:8001 |
| 订单服务 | 8002 | http://localhost:8002 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |
| Nacos | 8848 | http://localhost:8848 |
| Sentinel | 8858 | http://localhost:8858 |

## 🔧 常用命令

```bash
# 后端（在 services 目录下）
make up      # 启动基础设施
make down    # 停止基础设施
make dev     # 启动所有微服务
make help    # 查看所有命令

# 前端（在项目根目录）
pnpm dev:infra        # 启动基础设施（与 make up 等效）
pnpm dev:infra:logs    # 查看基础设施日志

# Docker Compose
docker-compose ps     # 查看服务状态
docker-compose down   # 停止所有服务
docker-compose down -v  # 清理数据（谨慎使用）
```

## 📚 详细文档

- [文档索引](./README.md) - 完整文档导航
- [完整开发指南](./local-development-guide.md) - 详细的开发环境设置和流程
- [故障排除](./troubleshooting.md) - 常见问题解决方案
- [开发者指南](./developer-guide.md) - 项目开发规范与命令速查
- [API 文档](./api/auth-api.md) - API 接口文档
