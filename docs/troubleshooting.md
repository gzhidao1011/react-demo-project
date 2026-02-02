# 故障排除指南

本文档整合了开发和生产环境中常见问题的解决方案。

## 目录

- [端口冲突](#1-端口冲突)
- [503 Unable to find instance for user-service](#2-503-unable-to-find-instance-for-user-service)
- [API Gateway 404 错误](#3-api-gateway-404-错误)
- [Docker 镜像静态资源不是最新](#4-docker-镜像静态资源不是最新)
- [数据库连接失败](#5-数据库连接失败)
- [Redis 连接失败](#6-redis-连接失败)
- [前端 API 请求失败](#7-前端-api-请求失败)
- [依赖安装失败](#8-依赖安装失败)
- [Maven 构建失败](#9-maven-构建失败)
- [Windows 上没有 make 命令](#10-windows-上没有-make-命令)

---

## 1. 端口冲突

### 问题描述

启动服务时出现端口已被占用错误：

```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:8001 -> 127.0.0.1:0: listen tcp 0.0.0.0:8001: bind: Only one usage of each socket address...
```

### 常见端口

| 服务 | 默认端口 | 说明 |
|------|---------|------|
| user-service | 8001 | 用户服务 |
| order-service | 8002 | 订单服务 |
| api-gateway | 8080 | API 网关 |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | Redis |
| Nacos | 8848 | 注册中心 |
| Sentinel | 8858 | 流量控制 |
| 前端 | 5173 | Web 应用 |

### 解决方案

#### Windows PowerShell

```powershell
# 1. 查找占用端口的进程
netstat -ano | findstr :8001

# 2. 停止进程（替换 PID 为实际进程 ID）
Stop-Process -Id <PID> -Force
```

#### Linux/Mac

```bash
# 查找并停止进程
lsof -i :8001
kill -9 <PID>
```

#### 检查 Docker 容器

```bash
# 查看占用端口的容器
docker ps -a --filter "publish=8001"

# 停止并删除容器
docker-compose down
```

#### 临时修改端口

修改 `docker-compose.prod.yml` 或 `application.yml` 中的端口映射。

---

## 2. 503 Unable to find instance for user-service

### 问题描述

访问 `/api/auth/register` 等接口时返回 503，错误信息为：

```
Unable to find instance for user-service
```

### 原因

API Gateway 通过 Nacos 服务发现将 `/api/auth/**` 路由到 `user-service`，但 **user-service 未运行或未成功注册到 Nacos**。

### 解决方案

**1. 确保基础设施已启动**

```bash
# 方式一：使用 Makefile
cd services
make up

# 方式二：使用 Docker Compose
docker-compose up -d mysql redis nacos sentinel

# 等待约 30 秒后检查 Nacos 是否就绪
curl http://localhost:8848/nacos/v1/console/health/readiness
```

**2. 启动所有微服务（推荐）**

```bash
cd services
make dev
```

该命令会并行启动 API Gateway、User Service、Order Service。**三个服务都必须运行**，缺一不可。

**3. 若使用 gateway-compose 单独启动**

```bash
cd services
make gateway-compose   # 终端 1：启动网关并自动拉起基础设施
make user             # 终端 2：启动用户服务
make order            # 终端 3：启动订单服务
```

**4. 验证 user-service 是否注册成功**

- 访问 Nacos 控制台：http://localhost:8848/nacos（默认 nacos/nacos）
- 在「服务管理」→「服务列表」中查看是否有 `user-service`
- 检查 user-service 健康：`curl http://localhost:8001/actuator/health`

### 预防措施

本地开发时务必使用 `make dev` 一次性启动所有微服务，或确保 user-service 和 order-service 在 API Gateway 之前或同时启动。

---

## 3. API Gateway 404 错误

### 问题描述

访问 `/api/auth/register` 等接口时返回 404。

### 原因

`application-docker.yml` 中缺少认证路由配置。

### 解决方案

确保 API Gateway 的 `application-docker.yml` 包含以下路由：

```yaml
routes:
  - id: auth-service
    uri: lb://user-service
    predicates:
      - Path=/api/auth/**
```

### 验证修复

```bash
# 重新构建并启动 API Gateway
docker-compose -f docker-compose.prod.yml stop api-gateway
docker-compose -f docker-compose.prod.yml build api-gateway
docker-compose -f docker-compose.prod.yml up -d api-gateway

# 测试接口
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 预防措施

修改路由配置时，确保 `application.yml` 和 `application-docker.yml` 配置一致。

---

## 4. Docker 镜像静态资源不是最新

### 问题描述

修改前端代码后，Docker 容器内仍显示旧内容。

### 原因

Docker Compose 在镜像已存在时会直接使用旧镜像，不会重新构建。

### 解决方案

```bash
# 强制重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build web storybook

# 或只更新特定应用
docker-compose -f docker-compose.prod.yml up -d --build web
```

### 生产环境最佳实践

使用版本标签避免覆盖：

```bash
export TAG=v1.0.0
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 5. 数据库连接失败

### 检查清单

- MySQL 容器是否运行：`docker ps | grep mysql`
- 数据库是否已创建：`docker exec -it mysql mysql -uroot -proot123 -e "SHOW DATABASES;"`
- 连接配置是否正确：检查 `application.yml`

### 解决方案

```bash
# 创建数据库
docker exec -it mysql mysql -uroot -proot123 -e "CREATE DATABASE IF NOT EXISTS user_db;"

# 检查服务日志
cd services/user-service && mvn spring-boot:run
```

---

## 6. Redis 连接失败

### 检查清单

- Redis 容器是否运行：`docker ps | grep redis`
- Redis 是否可访问：`docker exec -it redis redis-cli ping`（应返回 PONG）

### 解决方案

```bash
# 重启 Redis
docker-compose restart redis
```

---

## 7. 前端 API 请求失败

### 可能原因

- 后端服务未启动
- Vite 代理未配置
- CORS 配置问题

### 解决方案

1. **检查后端服务**：`curl http://localhost:8001/actuator/health`
2. **检查 Vite 代理**：`apps/web/vite.config.ts` 中应配置 `/api` 代理到 `http://localhost:8080`
3. **检查环境变量**：`VITE_API_BASE_URL` 如已设置，将使用该 URL 而非代理

---

## 8. 依赖安装失败

### 解决方案

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 清除缓存后重试
pnpm store prune
pnpm install
```

---

## 9. Maven 构建失败

### 解决方案

```bash
# 清理 Maven 缓存
rm -rf ~/.m2/repository

# 重新下载依赖
mvn clean install -U

# 跳过测试构建
mvn clean package -DskipTests
```

---

## 10. Windows 上没有 make 命令

### 问题描述

在 `services` 目录下执行 `make dev` 时提示找不到 `make` 命令。

### 解决方案

**方式一：安装 make（推荐）**

- **Git for Windows**：安装后自带 `make`，路径通常在 `C:\Program Files\Git\usr\bin\make.exe`
- **Chocolatey**：`choco install make`
- **WSL**：在 WSL 中运行 `make dev`

**方式二：手动启动各服务**

```powershell
cd services
# 在 3 个终端中分别执行
mvn spring-boot:run -pl api-gateway
mvn spring-boot:run -pl user-service
mvn spring-boot:run -pl order-service
```

---

## 相关文档

- [本地开发指南](./local-development-guide.md) - 完整开发流程
- [Docker 指南](./docker/docker-guide.md) - Docker 构建与部署
- [Docker Compose 配置参考](./docker/docker-compose-reference.md) - 配置说明
