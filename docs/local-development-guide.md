# 本地开发指南

本文档详细说明如何正确进行前后端本地开发。

## 📋 目录

- [前置要求](#前置要求)
- [项目结构](#项目结构)
- [开发环境设置](#开发环境设置)
- [前端开发](#前端开发)
- [后端开发](#后端开发)
- [完整开发流程](#完整开发流程)
- [常见问题](#常见问题)

## 前置要求

### 必需软件

- **Node.js** >= 22
- **pnpm** >= 10.28.0
- **Java** 17+（推荐使用 OpenJDK 17 或更高版本）
- **Maven** 3.8+
- **Docker** 和 **Docker Compose**（用于基础设施服务）

### 可选软件

- **IDE**：推荐使用 VSCode 或 IntelliJ IDEA
- **数据库客户端**：MySQL Workbench、DBeaver 等（用于查看数据库）

## 项目结构

```
react-demo-project/
├── apps/                    # 前端应用
│   ├── web/                 # Web 应用（React Router）
│   ├── docs/                # 文档应用
│   └── storybook/          # Storybook 组件展示
├── packages/                # 共享包
│   ├── ui/                  # UI 组件库
│   ├── utils/               # 工具函数库
│   ├── services/            # API 服务库（前端调用后端）
│   ├── schemas/             # Zod Schema 定义
│   └── propel/              # 增强组件库
├── services/                # 后端服务（Java）
│   ├── user-service/        # 用户服务（端口 8001）
│   ├── order-service/       # 订单服务（端口 8002）
│   ├── api-gateway/         # API 网关（端口 8080）
│   └── api-common/          # 共享 API 模块
└── docker/                  # Docker 配置
```

## 开发环境设置

### 1. 克隆仓库

```bash
git clone <repository-url>
cd react-demo-project
```

### 2. 安装前端依赖

```bash
# 安装所有依赖（包括 workspace 包）
pnpm install
```

### 3. 启动基础设施服务（Docker）

**方式一：使用 Docker Compose（推荐）**

```bash
# 启动所有基础设施服务（MySQL、Redis、Nacos、Sentinel）
docker-compose up -d mysql redis nacos sentinel

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f nacos
```

**方式二：单独启动服务**

```bash
# MySQL
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -p 3306:3306 \
  mysql:8.0

# Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Nacos（需要先启动 MySQL）
docker run -d \
  --name nacos \
  -e MODE=standalone \
  -e SPRING_DATASOURCE_PLATFORM=mysql \
  -e MYSQL_SERVICE_HOST=host.docker.internal \
  -e MYSQL_SERVICE_PORT=3306 \
  -e MYSQL_SERVICE_DB_NAME=nacos \
  -e MYSQL_SERVICE_USER=root \
  -e MYSQL_SERVICE_PASSWORD=root123 \
  -p 8848:8848 \
  nacos/nacos-server:v2.3.0
```

### 4. 初始化数据库

数据库会在首次启动时通过 Flyway 自动初始化，但需要先创建数据库：

```bash
# 连接到 MySQL
docker exec -it mysql mysql -uroot -proot123

# 创建数据库
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nacos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
EXIT;
```

**注意**：如果使用 Docker Compose，数据库会自动创建（通过 `docker/mysql/init/` 目录中的初始化脚本）。

### 5. 验证基础设施服务

```bash
# 检查 MySQL
docker exec -it mysql mysql -uroot -proot123 -e "SELECT 1"

# 检查 Redis
docker exec -it redis redis-cli ping
# 应该返回: PONG

# 检查 Nacos（浏览器访问）
# http://localhost:8848/nacos
# 默认用户名/密码: nacos/nacos
```

## 前端开发

### 启动前端开发服务器

```bash
# 方式一：从根目录启动（推荐，会自动启动所有相关包）
pnpm dev

# 方式二：仅启动 web 应用
pnpm --filter @repo/web dev

# 方式三：进入 web 目录启动
cd apps/web
pnpm dev
```

前端应用默认运行在：**http://localhost:5173**

### 前端 API 配置

前端 API 服务已配置为支持两种方式：

**方式一：使用 Vite 代理（默认，推荐）**

项目已配置 Vite 代理，所有 `/api` 请求会自动代理到 `http://localhost:8080`（API 网关）。

**配置位置**：`apps/web/vite.config.ts`

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
}
```

**优点**：
- ✅ 无需配置环境变量
- ✅ 自动处理 CORS
- ✅ 开发体验好

**方式二：使用环境变量（可选）**

如果需要直接调用后端（不使用代理），可以创建 `apps/web/.env` 文件：

```bash
# 直接使用完整 URL（不使用代理）
VITE_API_BASE_URL=http://localhost:8080/api
```

**注意**：
- 如果设置了 `VITE_API_BASE_URL`，将使用该 URL，不再使用代理
- 如果不设置，默认使用相对路径 `/api`，通过 Vite 代理转发

**示例文件**：参考 `apps/web/.env.example`

### 前端开发命令

```bash
# 开发模式（热重载）
pnpm --filter @repo/web dev

# 类型检查
pnpm --filter @repo/web check:types

# 运行测试
pnpm --filter @repo/web test

# 运行 E2E 测试
pnpm --filter @repo/web test:e2e

# 构建生产版本
pnpm --filter @repo/web build
```

## 后端开发

### 启动后端服务

#### 方式一：使用 Maven（推荐用于开发）

```bash
# 进入用户服务目录
cd services/user-service

# 启动用户服务（端口 8001）
mvn spring-boot:run

# 或使用 Spring Boot DevTools（自动重启）
mvn spring-boot:run -Dspring-boot.run.fork=false
```

**服务端口**：
- **用户服务**：`http://localhost:8001`
- **订单服务**：`http://localhost:8002`
- **API 网关**：`http://localhost:8080`

#### 方式二：使用 Docker Compose（完整环境）

```bash
# 从项目根目录启动所有服务
docker-compose up -d

# 仅启动后端服务（需要先启动基础设施）
docker-compose up -d user-service order-service api-gateway

# 查看日志
docker-compose logs -f user-service
```

**注意**：使用 Docker Compose 前需要先构建 jar 包：

```bash
cd services
mvn clean package -DskipTests
```

### 后端服务配置

#### 用户服务配置

配置文件：`services/user-service/src/main/resources/application.yml`

**关键配置**：

```yaml
server:
  port: 8001

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/user_db?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root123
  
  data:
    redis:
      host: localhost
      port: 6379
      password: # 如果 Redis 没有密码，留空
```

#### API 网关配置

API 网关负责路由请求到各个微服务，配置在 `services/api-gateway/src/main/resources/application.yml`。

**路由规则**：
- `/api/auth/**` → `user-service`
- `/api/users/**` → `user-service`
- `/api/orders/**` → `order-service`

### 后端开发命令

```bash
# 编译项目
cd services/user-service
mvn clean compile

# 运行测试
mvn test

# 运行集成测试
mvn verify

# 生成覆盖率报告
mvn jacoco:report

# 打包
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests
```

## 完整开发流程

### 1. 启动基础设施

```bash
# 启动 MySQL、Redis、Nacos
docker-compose up -d mysql redis nacos sentinel

# 等待服务就绪（约 30-60 秒）
docker-compose ps
```

### 2. 启动后端服务

**终端 1：启动用户服务**

```bash
cd services/user-service
mvn spring-boot:run
```

**终端 2：启动 API 网关（可选，如果前端直接调用用户服务则不需要）**

```bash
cd services/api-gateway
mvn spring-boot:run
```

**验证后端服务**：

```bash
# 检查用户服务健康状态
curl http://localhost:8001/actuator/health

# 检查 API 网关
curl http://localhost:8080/actuator/health
```

### 3. 启动前端服务

**终端 3：启动前端开发服务器**

```bash
# 从项目根目录
pnpm dev

# 或仅启动 web 应用
pnpm --filter @repo/web dev
```

前端应用将在 **http://localhost:5173** 启动。

### 4. 验证完整流程

1. **访问前端应用**：http://localhost:5173
2. **测试注册功能**：访问注册页面，创建新用户
3. **测试登录功能**：使用注册的账号登录
4. **检查后端日志**：查看用户服务的日志确认请求已到达

### 开发流程总结

```
┌─────────────────┐
│  基础设施服务    │
│ (Docker)        │
│ - MySQL:3306   │
│ - Redis:6379   │
│ - Nacos:8848   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐  ┌─────▼─────────┐
│   后端服务       │  │   API 网关     │
│ (Maven/Java)    │  │  (端口 8080)   │
│ - 用户服务:8001 │  │                │
│ - 订单服务:8002 │  │                │
└────────┬────────┘  └─────┬──────────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   前端应用       │
         │ (React Router)  │
         │ 端口: 5173      │
         └─────────────────┘
```

## 常见问题

### 1. 端口冲突

**问题**：端口已被占用

**解决方案**：

- **前端端口**：修改 `apps/web/vite.config.ts` 中的 `server.port`
- **后端端口**：修改 `services/*/src/main/resources/application.yml` 中的 `server.port`
- **MySQL 端口**：修改 `docker-compose.yml` 中的端口映射

### 2. 数据库连接失败

**问题**：后端无法连接到 MySQL

**检查清单**：
- ✅ MySQL 容器是否运行：`docker ps | grep mysql`
- ✅ 数据库是否已创建：`docker exec -it mysql mysql -uroot -proot123 -e "SHOW DATABASES;"`
- ✅ 连接字符串是否正确：检查 `application.yml` 中的数据库配置
- ✅ 网络是否正常：`docker network ls` 检查 Docker 网络

**解决方案**：

```bash
# 重新创建数据库
docker exec -it mysql mysql -uroot -proot123 -e "CREATE DATABASE IF NOT EXISTS user_db;"

# 检查用户服务日志
cd services/user-service
mvn spring-boot:run
# 查看是否有数据库连接错误
```

### 3. Redis 连接失败

**问题**：后端无法连接到 Redis

**检查清单**：
- ✅ Redis 容器是否运行：`docker ps | grep redis`
- ✅ Redis 是否可访问：`docker exec -it redis redis-cli ping`

**解决方案**：

```bash
# 重启 Redis
docker-compose restart redis

# 检查 Redis 配置
docker exec -it redis redis-cli CONFIG GET "*"
```

### 4. Nacos 连接失败

**问题**：后端服务无法注册到 Nacos

**检查清单**：
- ✅ Nacos 是否运行：访问 http://localhost:8848/nacos
- ✅ Nacos 数据库配置是否正确
- ✅ 后端服务的 Nacos 地址配置是否正确

**解决方案**：

```bash
# 检查 Nacos 日志
docker-compose logs -f nacos

# 检查 Nacos 数据库连接
docker exec -it mysql mysql -uroot -proot123 -e "USE nacos; SHOW TABLES;"
```

### 5. 前端 API 请求失败（CORS 或 404）

**问题**：前端无法调用后端 API

**可能原因**：
- API 代理未配置
- 后端服务未启动
- CORS 配置问题

**解决方案**：

1. **检查后端服务是否运行**：
   ```bash
   curl http://localhost:8001/actuator/health
   ```

2. **配置 Vite 代理**（在 `apps/web/vite.config.ts`）：
   ```typescript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8080',
         changeOrigin: true,
       },
     },
   },
   ```

3. **检查后端 CORS 配置**：确保后端允许前端域名访问

### 6. 依赖安装失败

**问题**：`pnpm install` 失败

**解决方案**：

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 如果仍有问题，尝试清除缓存
pnpm store prune
pnpm install
```

### 7. Maven 构建失败

**问题**：`mvn clean package` 失败

**解决方案**：

```bash
# 清理 Maven 缓存
rm -rf ~/.m2/repository

# 重新下载依赖
mvn clean install -U

# 跳过测试构建
mvn clean package -DskipTests
```

### 8. 热重载不工作

**问题**：前端代码修改后页面不更新

**解决方案**：

- **前端**：确保使用 `pnpm dev` 而不是 `pnpm build`
- **后端**：确保使用 `mvn spring-boot:run` 并启用 Spring Boot DevTools

### 9. 数据库迁移失败

**问题**：Flyway 迁移失败

**解决方案**：

```bash
# 检查迁移脚本语法
cd services/user-service/src/main/resources/db/migration

# 手动执行迁移（如果需要）
docker exec -it mysql mysql -uroot -proot123 user_db < V1__create_users_table.sql
```

## 开发最佳实践

### 1. 使用多个终端

建议使用多个终端窗口分别运行：
- 终端 1：基础设施服务（Docker）
- 终端 2：后端服务（Maven）
- 终端 3：前端服务（pnpm）

### 2. 使用环境变量

为不同环境创建不同的 `.env` 文件：
- `.env.development`：开发环境
- `.env.production`：生产环境

### 3. 使用 Git Hooks

项目已配置 Git hooks，提交前会自动：
- 格式化代码
- 运行 Lint 检查
- 运行类型检查

### 4. 使用 Docker Compose 管理服务

对于基础设施服务，优先使用 Docker Compose，便于统一管理。

### 5. 监控日志

开发时密切关注日志输出：
- 前端：浏览器控制台 + 终端输出
- 后端：Maven 输出 + 应用日志文件

## 相关文档

- [开发者指南](./developer-guide.md) - 项目开发规范与命令速查
- [故障排除](./troubleshooting.md) - 常见问题解决方案
- [Docker 指南](./docker/docker-guide.md) - Docker 构建与部署
- [API 文档](./api/auth-api.md) - API 接口文档
- [测试规范](../../.cursor/rules/20-测试与覆盖率规范.mdc) - 测试编写规范
- [代码风格规范](../../.cursor/rules/01-代码风格.mdc) - 代码风格指南

## 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 检查项目 Issues
3. 查看相关服务的日志
4. 联系团队成员
