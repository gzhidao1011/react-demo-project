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

```bash
cd services/user-service
mvn spring-boot:run
```

**服务地址**：http://localhost:8001

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
2. **检查后端健康**：http://localhost:8001/actuator/health
3. **检查 Nacos**：http://localhost:8848/nacos (nacos/nacos)

## 📝 服务端口

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端应用 | 5173 | http://localhost:5173 |
| API 网关 | 8080 | http://localhost:8080 |
| 用户服务 | 8001 | http://localhost:8001 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |
| Nacos | 8848 | http://localhost:8848 |
| Sentinel | 8858 | http://localhost:8858 |

## 🔧 常用命令

```bash
# 查看基础设施服务状态
docker-compose ps

# 查看基础设施服务日志
pnpm dev:infra:logs

# 停止所有服务
docker-compose down

# 清理数据（谨慎使用）
docker-compose down -v
```

## 📚 详细文档

- [完整开发指南](./local-development-guide.md) - 详细的开发环境设置和故障排除
- [开发者指南](./developer-guide.md) - 项目开发规范
- [API 文档](./api/auth-api.md) - API 接口文档
