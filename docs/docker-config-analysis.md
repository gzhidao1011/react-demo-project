# Docker 配置文件一致性分析报告

> **更新日期**：2026-02-03
> **状态**：✅ 已修复所有不一致问题

## 概述

本报告分析了项目中所有 Docker 相关配置文件的一致性，包括：
- `docker-compose.yml`（开发环境）
- `docker-compose.prod.yml`（生产环境）
- `docker-compose.infra.yml`（基础设施专用）
- 各服务的 Dockerfile

## 修复记录

### ✅ 已完成的修复（2026-02-03）

1. **order-service Dockerfile**：改为多阶段构建，与其他服务保持一致
2. **order-service 构建上下文**：统一为 `./services`
3. **生产环境 order-service**：添加 build 配置作为兜底
4. **MySQL 密码配置**：统一使用环境变量 `${MYSQL_ROOT_PASSWORD:-root123}`
5. **Redis 密码配置**：统一默认值处理方式 `${REDIS_PASSWORD:-}`
6. **user-service Admin 初始化**：生产环境添加完整配置
7. **auth-service RESEND_API_KEY**：生产环境添加配置
8. **docker-compose.infra.yml**：统一 MySQL 密码配置方式

## 1. Docker Compose 文件对比

### 1.1 基础设施服务一致性

#### ✅ 一致的部分

| 服务 | docker-compose.yml | docker-compose.prod.yml | docker-compose.infra.yml | 状态 |
|------|-------------------|------------------------|-------------------------|------|
| **MySQL** | ✅ | ✅ | ✅ | **一致** |
| **Nacos** | ✅ | ✅ | ✅ | **一致** |
| **Sentinel** | ✅ | ✅ | ✅ | **一致** |
| **Redis** | ✅ | ✅ | ✅ | **一致** |

基础设施服务的配置基本一致，包括：
- 镜像版本相同
- 端口映射相同
- 健康检查配置相同
- 网络配置相同
- 数据卷配置相同

#### ⚠️ 不一致的部分

**MySQL 密码配置方式：**

- `docker-compose.yml`: 硬编码 `MYSQL_ROOT_PASSWORD: root123`
- `docker-compose.prod.yml`: 使用环境变量 `MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root123}`
- `docker-compose.infra.yml`: 硬编码 `MYSQL_ROOT_PASSWORD: root123`

**建议：** 统一使用环境变量方式，提高安全性。

**MySQL healthcheck 密码：**

- `docker-compose.yml`: 硬编码 `-proot123`
- `docker-compose.prod.yml`: 使用环境变量 `-p${MYSQL_ROOT_PASSWORD:-root123}`
- `docker-compose.infra.yml`: 硬编码 `-proot123`

**建议：** 统一使用环境变量方式。

**Nacos MySQL 密码：**

- `docker-compose.yml`: 硬编码 `MYSQL_SERVICE_PASSWORD=root123`
- `docker-compose.prod.yml`: 使用环境变量 `MYSQL_SERVICE_PASSWORD=${MYSQL_ROOT_PASSWORD:-root123}`
- `docker-compose.infra.yml`: 硬编码 `MYSQL_SERVICE_PASSWORD=root123`

**建议：** 统一使用环境变量方式。

### 1.2 Java 微服务配置对比

#### user-service

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/user-service:latest` | `${REGISTRY:-gzhidao1010}/user-service:${TAG:-latest}` | ⚠️ |
| **构建上下文** | `./services` | `./services` | ✅ |
| **环境变量** | 包含 `env_file` 和 `ADMIN_INIT_*` | 不包含 `env_file` 和 `ADMIN_INIT_*` | ⚠️ |
| **MySQL 密码** | 硬编码 `root123` | 环境变量 `${MYSQL_ROOT_PASSWORD:-root123}` | ⚠️ |
| **Redis 密码** | `${REDIS_PASSWORD}` | `${REDIS_PASSWORD:-}` | ⚠️ |

**关键差异：**
1. **Admin 初始化配置**：开发环境支持从 `.env` 文件加载 `ADMIN_INIT_*` 配置，生产环境没有
2. **镜像命名**：开发环境使用 `microservices/` 前缀，生产环境使用 `${REGISTRY}` 变量

#### auth-service

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/auth-service:latest` | `${REGISTRY:-gzhidao1010}/auth-service:${TAG:-latest}` | ⚠️ |
| **环境变量** | 包含 `RESEND_API_KEY` | 不包含 `RESEND_API_KEY` | ⚠️ |
| **Redis 密码** | `${REDIS_PASSWORD}` | `${REDIS_PASSWORD:-}` | ⚠️ |

**关键差异：**
1. **RESEND_API_KEY**：开发环境有，生产环境没有（可能通过其他方式配置）

#### order-service

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像（无 build） | ⚠️ |
| **构建上下文** | `./services/order-service` | `./services` | ⚠️ |
| **镜像名称** | `microservices/order-service:latest` | `${REGISTRY:-gzhidao1010}/order-service:${TAG:-latest}` | ⚠️ |
| **MySQL 密码** | 硬编码 `root123` | 环境变量 `${MYSQL_ROOT_PASSWORD:-root123}` | ⚠️ |

**关键差异：**
1. **构建上下文不一致**：开发环境使用 `./services/order-service`，生产环境使用 `./services`
2. **生产环境没有 build 配置**：生产环境只使用远程镜像，不提供本地构建兜底

#### chat-service

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/chat-service:latest` | `${REGISTRY:-gzhidao1010}/chat-service:${TAG:-latest}` | ⚠️ |
| **env_file** | `./services/.env` | `./services/.env` | ✅ |
| **MySQL 密码** | 硬编码 `root123` | 环境变量 `${MYSQL_ROOT_PASSWORD:-root123}` | ⚠️ |
| **LLM 配置** | 从 `.env` 加载 | 从 `.env` 加载 + 环境变量默认值 | ⚠️ |

**关键差异：**
1. **LLM 配置方式**：生产环境提供了更多默认值配置

#### api-gateway

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/api-gateway:latest` | `${REGISTRY:-gzhidao1010}/api-gateway:${TAG:-latest}` | ⚠️ |

### 1.3 前端应用配置对比

#### web 应用

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/web:latest` | `${REGISTRY:-gzhidao1010}/web:${TAG:-latest}` | ⚠️ |
| **健康检查** | ✅ | ✅ | ✅ |

#### storybook

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **构建方式** | 本地构建 | 远程镜像 + 本地构建（兜底） | ⚠️ |
| **镜像名称** | `microservices/storybook:latest` | `${REGISTRY:-gzhidao1010}/storybook:${TAG:-latest}` | ⚠️ |
| **健康检查** | ✅ | ✅ | ✅ |

### 1.4 nginx-proxy 配置

| 配置项 | docker-compose.yml | docker-compose.prod.yml | 差异 |
|--------|-------------------|------------------------|------|
| **镜像** | `nginx:alpine` | `nginx:alpine` | ✅ |
| **端口映射** | `8888:80`, `8443:443` | `8888:80`, `8443:443` | ✅ |
| **健康检查** | ✅ | ✅ | ✅ |

## 2. Dockerfile 一致性分析

### 2.1 Java 微服务 Dockerfile

#### ✅ 一致的 Dockerfile

以下服务的 Dockerfile 结构一致（多阶段构建）：

- `user-service/Dockerfile`
- `auth-service/Dockerfile`
- `api-gateway/Dockerfile`
- `chat-service/Dockerfile`

**共同特点：**
- 使用多阶段构建（builder + runtime）
- 使用 `maven:3.9-eclipse-temurin-17-alpine` 作为构建镜像
- 使用 `eclipse-temurin:17-jdk-alpine` 作为运行镜像
- 构建上下文：`./services`
- 包含健康检查配置
- 使用相同的 JVM 参数

#### ⚠️ 不一致的 Dockerfile

**order-service/Dockerfile：**

- ❌ **单阶段构建**：需要先本地构建 jar 包
- ❌ **构建上下文不同**：`./services/order-service`（在 docker-compose.yml 中）
- ⚠️ **与其他服务不一致**：其他服务都使用多阶段构建

**建议：** 统一使用多阶段构建，与其他服务保持一致。

### 2.2 前端应用 Dockerfile

#### ✅ 一致的 Dockerfile

- `apps/web/Dockerfile`
- `apps/storybook/Dockerfile`

**共同特点：**
- 使用多阶段构建（pruner + installer + builder + nginx）
- 使用 `node:22-alpine` 作为构建镜像
- 使用 `nginx:alpine` 作为运行镜像
- 使用 `turbo prune` 优化构建上下文
- 使用 `pnpm` 作为包管理器
- 使用相同的 pnpm 版本（10.28.0）

## 3. 主要不一致问题总结

### ✅ 3.1 已修复的严重不一致问题

1. ~~**order-service 构建上下文不一致**~~ ✅ **已修复**
   - 统一为 `./services`
   - 所有 compose 文件已一致

2. ~~**order-service Dockerfile 构建方式不一致**~~ ✅ **已修复**
   - 已改为多阶段构建，与其他服务一致
   - 支持 Docker 内自动编译

3. ~~**生产环境 order-service 缺少 build 配置**~~ ✅ **已修复**
   - 已添加 build 配置作为兜底

### ✅ 3.2 已修复的中等不一致问题

1. ~~**MySQL 密码配置方式不统一**~~ ✅ **已修复**
   - 统一使用环境变量 `${MYSQL_ROOT_PASSWORD:-root123}`
   - 所有 compose 文件已一致

2. ~~**Redis 密码配置方式不统一**~~ ✅ **已修复**
   - 统一使用 `${REDIS_PASSWORD:-}` 默认值处理方式

3. ~~**user-service Admin 初始化配置**~~ ✅ **已修复**
   - 生产环境已添加完整配置和 `env_file` 支持

4. ~~**auth-service RESEND_API_KEY**~~ ✅ **已修复**
   - 生产环境已添加 `RESEND_API_KEY` 配置

5. **镜像命名规范不统一**（预期差异）
   - 开发环境：`microservices/service:latest`
   - 生产环境：`${REGISTRY}/service:${TAG}`
   - **说明**：这是预期的差异，符合不同环境的部署需求

### 3.3 🟢 轻微不一致（合理差异）

1. **chat-service LLM 配置默认值**
   - 生产环境提供了更多默认值配置
   - **说明**：这是合理的差异，生产环境需要更多配置

## 4. 建议修复方案

### 4.1 统一 order-service 构建配置

**方案 1：修改 order-service Dockerfile 为多阶段构建**

```dockerfile
# 阶段1：构建 jar 文件
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY order-service/pom.xml ./order-service/
# ... 其他模块 pom.xml

RUN mvn dependency:go-offline -B -pl order-service -am || true

COPY api-common ./api-common
COPY order-service ./order-service

RUN mvn clean package -DskipTests -B -pl order-service -am

# 阶段2：运行镜像
FROM eclipse-temurin:17-jdk-alpine
# ... 后续配置
```

**方案 2：统一 docker-compose 中的构建上下文**

- `docker-compose.yml` 中 order-service 的构建上下文改为 `./services`
- 与 `docker-compose.prod.yml` 保持一致

### 4.2 统一环境变量配置

**统一 MySQL 密码配置：**

```yaml
# docker-compose.yml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root123}
```

**统一 Redis 密码配置：**

```yaml
# docker-compose.yml
environment:
  - REDIS_PASSWORD=${REDIS_PASSWORD:-}
```

### 4.3 统一生产环境配置

**为 order-service 添加 build 配置：**

```yaml
# docker-compose.prod.yml
order-service:
  image: ${REGISTRY:-gzhidao1010}/order-service:${TAG:-latest}
  build:
    context: ./services
    dockerfile: order-service/Dockerfile
  # ... 其他配置
```

**为 user-service 添加 Admin 初始化配置：**

```yaml
# docker-compose.prod.yml
user-service:
  env_file:
    - ./services/.env
  environment:
    # ... 现有配置
    - ADMIN_INIT_ENABLED=${ADMIN_INIT_ENABLED:-true}
    - ADMIN_INIT_EMAIL=${ADMIN_INIT_EMAIL:-}
    - ADMIN_INIT_PASSWORD=${ADMIN_INIT_PASSWORD:-}
    - ADMIN_INIT_NAME=${ADMIN_INIT_NAME:-Administrator}
    - ADMIN_INIT_PHONE=${ADMIN_INIT_PHONE:-}
```

**为 auth-service 添加 RESEND_API_KEY：**

```yaml
# docker-compose.prod.yml
auth-service:
  environment:
    # ... 现有配置
    - RESEND_API_KEY=${RESEND_API_KEY:-}
```

## 5. 配置文件一致性检查清单

### ✅ 已一致

- [x] 基础设施服务配置（mysql, nacos, sentinel, redis）
- [x] 网络配置（microservices-network）
- [x] 数据卷配置
- [x] 前端应用 Dockerfile（web, storybook）
- [x] 所有 Java 微服务 Dockerfile（user-service, auth-service, api-gateway, chat-service, **order-service**）
- [x] nginx-proxy 配置
- [x] order-service 构建上下文（统一为 `./services`）
- [x] order-service Dockerfile（多阶段构建）
- [x] MySQL 密码配置方式（统一使用环境变量）
- [x] Redis 密码配置方式（统一默认值处理）
- [x] user-service Admin 初始化配置（生产环境已添加）
- [x] auth-service RESEND_API_KEY 配置（生产环境已添加）
- [x] 生产环境 order-service build 配置（已添加）

### ✅ 已修复

- [x] ~~order-service 构建上下文不一致~~ ✅
- [x] ~~order-service Dockerfile 构建方式不一致~~ ✅
- [x] ~~MySQL 密码配置方式不统一~~ ✅
- [x] ~~Redis 密码配置方式不统一~~ ✅
- [x] ~~user-service Admin 初始化配置不一致~~ ✅
- [x] ~~auth-service RESEND_API_KEY 配置不一致~~ ✅
- [x] ~~生产环境 order-service 缺少 build 配置~~ ✅

## 6. 总结

### 一致性评分（修复后）

- **基础设施服务**：100% 一致 ✅
- **Java 微服务**：100% 一致 ✅
- **前端应用**：100% 一致 ✅
- **Dockerfile**：100% 一致 ✅

### 总体评价

✅ **所有不一致问题已修复**

项目的 Docker 配置文件现在完全一致：

1. ✅ **order-service** 的构建配置已与其他服务统一（多阶段构建，统一构建上下文）
2. ✅ **环境变量配置方式**已在开发和生产环境统一（统一使用环境变量和默认值）
3. ✅ **所有服务配置**在生产环境已完整（Admin 初始化、RESEND_API_KEY 等）

### 修复详情

所有修复已完成，配置文件现在：
- 使用统一的环境变量配置方式
- 所有服务使用一致的构建方式
- 开发和生产环境配置完整且一致
- 符合最佳实践和安全规范
