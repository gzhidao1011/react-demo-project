# Docker Compose 配置参考

## 概述

项目包含两个 Docker Compose 配置文件：

- `docker-compose.yml` - 开发环境配置（本地构建）
- `docker-compose.prod.yml` - 生产环境配置（使用远程镜像）

## 配置文件对比

### 基础设施服务

| 服务 | 说明 | 状态 |
|------|------|------|
| MySQL | 数据库，端口 3306 | ✅ 已同步 |
| Redis | Token 存储、限流，端口 6379 | ✅ 已同步 |
| Nacos | 注册中心/配置中心，端口 8848 | ✅ 已同步 |
| Sentinel | 流量控制，端口 8858 | ✅ 已同步 |

### Java 微服务

| 服务 | 端口 | 说明 |
|------|------|------|
| user-service | 8001 | 用户服务，依赖 MySQL、Redis |
| order-service | 8002 | 订单服务 |
| api-gateway | 8080 | API 网关 |

### 前端应用

| 应用 | 说明 |
|------|------|
| web | Web 应用，通过 nginx-proxy 访问 |
| docs | 文档应用 |
| storybook | Storybook 组件展示 |
| nginx-proxy | 统一入口，端口 8888 (HTTP)、8443 (HTTPS) |

## 主要差异

| 项目 | docker-compose.yml | docker-compose.prod.yml |
|------|-------------------|-------------------------|
| 构建方式 | 本地构建 | 远程镜像 + 本地构建兜底 |
| 环境变量 | 硬编码 | 使用 `${VAR:-default}` |
| 镜像仓库 | 本地镜像 | 远程镜像仓库 |

## 使用建议

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 仅启动基础设施
docker-compose up -d mysql redis nacos sentinel
```

### 生产环境

```bash
export REGISTRY=your-registry.com/namespace
export TAG=v1.0.0
export MYSQL_ROOT_PASSWORD=your-secure-password
export REDIS_PASSWORD=your-redis-password

docker-compose -f docker-compose.prod.yml up -d
```

## 注意事项

1. **镜像仓库**：生产环境需配置 `REGISTRY` 环境变量
2. **密码安全**：生产环境务必使用强密码
3. **Redis 密码**：如 Redis 有密码，需配置 `REDIS_PASSWORD`
4. **健康检查**：所有服务均配置健康检查
5. **数据持久化**：数据卷已配置，确保数据持久化

## 相关文档

- [Docker 构建和部署指南](./docker-guide.md)
- [本地开发指南](../local-development-guide.md)
- [部署与发布规范](../../.cursor/rules/12-部署与发布规范.mdc)
