# 前端 Docker 集成部署方案（基于 Turborepo 最佳实践 - 多级域名）

## 概述

本文档基于 Turborepo 官方文档和国外主流实践，提供完整的 monorepo 前端应用 Docker 部署方案。使用 `turbo prune` 优化构建，采用多阶段 Docker 构建，最终使用 Nginx 服务静态文件。采用多级域名部署方案，通过 Nginx 反向代理根据域名路由到不同应用。

## 项目现状分析

### 应用列表

`apps/` 目录下包含以下前端应用：

1. **`apps/web`** - `@repo/web`
   - 主前端应用
   - 域名：`web.example.com`

2. **`apps/docs`** - `@repo/docs`
   - 文档应用
   - 域名：`docs.example.com`

### 技术栈

- **前端框架**：React Router v7.12.0（SSR 关闭，`ssr: false`）
- **构建工具**：Turborepo 2.7.4（monorepo 构建管理）
- **包管理**：pnpm workspace (monorepo)
- **构建命令**：
  - 根目录：`turbo run build`（构建所有应用和依赖包）
  - 单个应用：`turbo run build --filter @repo/{app}`（只构建指定应用及其依赖）
- **构建输出**：`apps/{app}/build/` 目录
  - `build/client/` - 静态资源（HTML、JS、CSS）- **用于 Nginx 部署**
  - `build/server/` - 服务端代码（即使 SSR 关闭，React Router 仍会生成，用于 `react-router-serve`）
- **Node 版本要求**：>= 22
- **pnpm 版本要求**：>= 10.28.0
- **Workspace 依赖**（所有应用共享）：
  - `@repo/ui` - UI 组件库
  - `@repo/utils` - 工具函数
  - `@repo/services` - API 服务
  - `@repo/schemas` - 验证 schema
  - `@repo/propel` - 主题和 Toast

### 现有问题

1. **Dockerfile 问题**：
   - ❌ 使用 `npm` 而非 `pnpm`
   - ❌ 使用 `node:20-alpine` 而非 `node:22-alpine`
   - ❌ 未考虑 monorepo 结构
   - ❌ 未使用 `turbo prune` 优化构建

2. **部署配置问题**：
   - ❌ `docker-compose.yml` 中缺少前端服务
   - ❌ 没有 Nginx 配置文件
   - ❌ 没有 Nginx 反向代理配置

## 解决方案：基于 Turborepo 的多级域名部署

### 核心策略：使用 `turbo prune`

根据 [Turborepo 官方文档](https://turbo.build/repo/docs/handbook/deploying-with-docker)，推荐使用 `turbo prune` 创建精简的 monorepo，只包含目标应用所需的依赖。

**优势**：
- ✅ 只包含必要的依赖，减少镜像大小
- ✅ 避免无关变更导致 Docker 缓存失效
- ✅ 优化 Docker 层缓存（`--docker` 标志）
- ✅ 支持多阶段构建优化

### 架构设计

```
turbo prune @repo/<app> --docker
  ↓
生成精简 monorepo (out/)
  ├── json/     - package.json 文件（用于依赖安装）
  └── full/     - 完整源代码（用于构建）
  ↓
多阶段 Docker 构建
  ├── 阶段1：使用 turbo prune 创建精简 monorepo
  ├── 阶段2：安装依赖
  ├── 阶段3：构建应用
  └── 阶段4：Nginx 静态服务
  ↓
Nginx 反向代理（根据域名路由）
  ├── web.example.com → web:80
  └── docs.example.com → docs:80
```

### 多级域名部署优势

- ✅ 统一使用 80/443 端口，更专业
- ✅ 易于扩展，通过域名添加新应用
- ✅ 统一 SSL/HTTPS 配置（在反向代理层）
- ✅ 更好的用户体验（标准域名访问）
- ✅ 支持负载均衡和故障转移

## 实施步骤

### 步骤 1：创建应用级 Nginx 配置文件

为每个应用创建独立的 Nginx 配置文件：

**文件**：
- `apps/web/nginx.conf`
- `apps/docs/nginx.conf`

**配置内容**（支持 SPA 路由，API 代理在反向代理层统一处理）：

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持：所有路由返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 步骤 2：创建优化的 Dockerfile

**文件**：
- `apps/web/Dockerfile`
- `apps/docs/Dockerfile`

**基于 Turborepo 最佳实践的多阶段构建**：

```dockerfile
# 参数：应用名称
ARG APP_NAME=web

# 阶段1：使用 turbo prune 创建精简 monorepo
FROM node:22-alpine AS pruner
WORKDIR /app
# 复制必要的文件用于 prune
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY .npmrc* ./  # 添加 .npmrc 文件（turbo.json globalDependencies）
COPY biome.json ./  # 添加 biome.json（turbo.json globalDependencies）
# 复制目标应用的 package.json（turbo prune 需要）
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/
# 复制所有 packages 目录（turbo prune 需要分析所有 workspace 包的依赖关系）
# 注意：虽然会复制所有 packages，但 turbo prune 只会保留目标应用实际依赖的包
COPY packages ./packages
# 安装 pnpm 和 turbo
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --frozen-lockfile
# 使用 turbo prune 创建精简 monorepo（使用完整的包名）
RUN pnpm turbo prune @repo/${APP_NAME} --docker

# 阶段2：安装依赖
FROM node:22-alpine AS installer
WORKDIR /app
# 复制 pruned 的 package.json 文件
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# 安装依赖
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --frozen-lockfile

# 阶段3：构建应用
FROM node:22-alpine AS builder
WORKDIR /app
ARG APP_NAME
# 复制依赖
COPY --from=installer /app/node_modules ./node_modules
# 复制 pruned 的源代码
COPY --from=pruner /app/out/full/ .
# 构建应用（使用 Turborepo，使用完整的包名）
RUN pnpm turbo run build --filter=@repo/${APP_NAME}

# 阶段4：Nginx 生产镜像
FROM nginx:alpine
ARG APP_NAME
# 复制构建产物
COPY --from=builder /app/apps/${APP_NAME}/build/client /usr/share/nginx/html
# 复制 Nginx 配置
COPY apps/${APP_NAME}/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**关键点**：
- 使用 `turbo prune @repo/${APP_NAME}` 创建精简 monorepo（必须使用完整的包名）
- `--docker` 标志优化 Docker 层缓存
- 分离依赖安装和构建阶段
- 最终镜像只包含 Nginx 和静态文件
- 构建命令使用 `--filter=@repo/${APP_NAME}`（必须使用完整的包名）

**重要说明**：
- `APP_NAME` 参数值应该是 `web` 或 `docs`（不包含 `@repo/` 前缀）
- 但在 `turbo prune` 和 `turbo run build --filter` 命令中，必须使用完整的包名 `@repo/${APP_NAME}`
- 这是因为 Turborepo 使用完整的包名来识别 workspace 包
- Prune 阶段需要复制所有 `packages` 目录，以便 `turbo prune` 能够分析完整的依赖关系
- 虽然复制了所有 packages，但 `turbo prune` 只会保留目标应用实际依赖的包到 `out/` 目录

### 步骤 3：创建 Nginx 反向代理配置

**文件**：
- `docker/nginx/nginx.conf` - Nginx 主配置文件
- `docker/nginx/conf.d/default.conf` - 反向代理配置（根据域名路由）

**目录结构**：
```
docker/
  nginx/
    nginx.conf          # Nginx 主配置
    conf.d/
      default.conf      # 域名路由配置
    ssl/                # SSL 证书目录（可选）
```

**`docker/nginx/nginx.conf`**：
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # 包含服务器配置
    include /etc/nginx/conf.d/*.conf;
}
```

**`docker/nginx/conf.d/default.conf`**：
```nginx
# Web 应用 - web.example.com
server {
    listen 80;
    server_name web.example.com;

    # 前端应用代理
    location / {
        proxy_pass http://web:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 代理
    location /api {
        proxy_pass http://api-gateway:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Docs 应用 - docs.example.com
server {
    listen 80;
    server_name docs.example.com;

    # 前端应用代理
    location / {
        proxy_pass http://docs:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 代理
    location /api {
        proxy_pass http://api-gateway:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# 默认服务器（返回 404 或重定向）
server {
    listen 80 default_server;
    server_name _;
    return 404;
}
```

**DNS 配置说明**：
- **生产环境**：需要配置域名解析，将 `web.example.com` 和 `docs.example.com` 指向服务器 IP
- **开发环境**：可以使用 `/etc/hosts` 文件模拟：
  ```
  127.0.0.1 web.example.com
  127.0.0.1 docs.example.com
  ```

### 步骤 4：更新 docker-compose.yml

**文件**：`docker-compose.yml`

**多级域名部署方案**：所有应用使用同一端口（80），通过 Nginx 反向代理根据域名路由：

```yaml
services:
  # ... 现有服务（mysql, nacos, sentinel, user-service, order-service, api-gateway）...

  # Web 应用（不暴露端口，仅内部访问）
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        APP_NAME: web
    image: microservices/web:latest
    container_name: web
    # 不暴露端口，仅通过反向代理访问
    expose:
      - "80"
    networks:
      - microservices-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # Docs 应用（不暴露端口，仅内部访问）
  docs:
    build:
      context: .
      dockerfile: apps/docs/Dockerfile
      args:
        APP_NAME: docs
    image: microservices/docs:latest
    container_name: docs
    # 不暴露端口，仅通过反向代理访问
    expose:
      - "80"
    networks:
      - microservices-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  # Nginx 反向代理（根据域名路由）
  nginx-proxy:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"  # HTTPS 支持
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro  # SSL 证书（可选）
    depends_on:
      - web
      - docs
      - api-gateway
    networks:
      - microservices-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**访问方式**：
- Web: `http://web.example.com`（或开发环境使用 `http://web.example.com` 通过 hosts 文件）
- Docs: `http://docs.example.com`（或开发环境使用 `http://docs.example.com` 通过 hosts 文件）

### 步骤 5：更新 docker-compose.prod.yml

添加生产环境配置，使用远程镜像仓库（多级域名方案）。

### 步骤 6：优化 .dockerignore

**文件**：`.dockerignore`

```
# 构建输出（会在 Docker 中重新构建）
**/build/
**/dist/
**/.next/
**/.react-router/

# 依赖
node_modules/
.pnpm-store/

# 开发文件
.env.local
.env.development
*.log
.DS_Store

# IDE
.vscode/
.idea/
.cursor/

# Git
.git/
.gitignore

# 文档
docs/
*.md
!README.md

# 测试
**/__tests__/
**/*.test.*
**/*.spec.*

# 注意：pnpm-lock.yaml 不应该被忽略
# 构建时需要 lockfile 来确保依赖版本一致
# 如果 lockfile 变更，应该让 Docker 层缓存失效（这是正确的行为）
# ⚠️ 重要：如果 .dockerignore 中有 pnpm-lock.yaml，需要移除它
```

**重要修正**：
- ⚠️ **当前 `.dockerignore` 文件忽略了 `pnpm-lock.yaml`**，这会导致构建失败
- ✅ **必须从 `.dockerignore` 中移除 `pnpm-lock.yaml` 这一行**
- ✅ 构建时需要 lockfile 来确保依赖版本一致（使用 `--frozen-lockfile` 标志）

## 技术细节

### Turborepo Prune 工作原理

根据 [Turborepo 文档](https://turbo.build/docs/reference/prune)：

1. **`turbo prune <package>`**：
   - 分析依赖图，找出目标包及其所有依赖
   - 创建精简的 monorepo 结构

2. **`--docker` 标志**：
   - 将输出组织为 `json/` 和 `full/` 目录
   - `json/`：只包含 package.json 文件（用于依赖安装层）
   - `full/`：包含完整源代码（用于构建层）
   - 优化 Docker 层缓存：package.json 变更不会影响源代码层

### 多阶段构建优势

1. **Prune 阶段**：
   - 创建精简 monorepo，只包含必要依赖
   - 优化 Docker 层缓存

2. **依赖安装阶段**：
   - 只安装 pruned monorepo 中的依赖
   - 减少 `node_modules` 大小
   - 利用 Docker 层缓存

3. **构建阶段**：
   - 使用 Turborepo 构建
   - 自动处理 workspace 依赖关系
   - 支持并行和增量构建

4. **生产镜像**：
   - 只包含 Nginx 和静态文件（约 40MB）
   - 不包含 Node.js 运行时
   - 不包含源代码和依赖

### 环境变量处理

由于使用静态文件部署，环境变量需要在构建时注入。但由于配置了 Nginx API 代理，前端可以使用相对路径。

**推荐方案：使用相对路径**

前端代码中使用相对路径，通过 Nginx 代理：
```typescript
// 前端代码中
const response = await fetch('/api/auth/login', { ... });
```

**备选方案：构建时注入环境变量**

如果需要绝对 URL，在 Dockerfile 中注入：

```dockerfile
# 在 builder 阶段
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建时使用（必须使用完整的包名）
RUN pnpm turbo run build --filter=@repo/${APP_NAME}
```

**推荐使用相对路径方案**：
- ✅ 更简单，不需要配置环境变量
- ✅ 通过 Nginx 代理统一处理
- ✅ 支持开发和生产环境使用相同代码

### API 代理配置

**必需配置**：所有前端应用都需要配置 API 代理，将 `/api/*` 请求转发到 API 网关。

**配置位置**：
- 反向代理配置：`docker/nginx/conf.d/default.conf` 中的 `location /api` 块
- **注意**：应用级 Nginx 配置（`apps/{app}/nginx.conf`）只处理静态文件，不包含 API 代理

**工作原理**：
1. 前端应用发起 API 请求（如 `/api/auth/login`）
2. Nginx 拦截 `/api` 开头的请求
3. 代理转发到 `http://api-gateway:8080`（Docker 服务名）
4. API 网关处理请求并返回响应
5. Nginx 将响应返回给前端

**优势**：
- ✅ 解决跨域问题（同源策略）
- ✅ 统一 API 入口，便于管理
- ✅ 支持负载均衡和故障转移（如果配置多个网关实例）
- ✅ 可以添加认证、限流等中间件

**注意事项**：
- API 网关服务名必须是 `api-gateway`（与 docker-compose.yml 中的服务名一致）
- 确保前端应用和 API 网关在同一 Docker 网络（`microservices-network`）
- 如果 API 路径不是 `/api`，需要相应调整 Nginx 配置

## 文件清单

### Web 应用
1. `apps/web/nginx.conf` - **新建** Nginx 配置文件（仅处理静态文件，API 代理在反向代理层）
2. `apps/web/Dockerfile` - **重写** 基于 Turborepo prune 的 Dockerfile

### Docs 应用
3. `apps/docs/nginx.conf` - **新建** Nginx 配置文件（仅处理静态文件，API 代理在反向代理层）
4. `apps/docs/Dockerfile` - **重写** 基于 Turborepo prune 的 Dockerfile

### Nginx 反向代理配置（多级域名方案）
5. `docker/nginx/nginx.conf` - **新建** Nginx 主配置文件
6. `docker/nginx/conf.d/default.conf` - **新建** 反向代理配置（根据域名路由）
7. `docker/nginx/ssl/` - **新建** SSL 证书目录（HTTPS 支持，可选）

### Docker Compose 配置
8. `docker-compose.yml` - 添加 web、docs 服务和 nginx-proxy 反向代理配置
9. `docker-compose.prod.yml` - 添加生产环境配置（多级域名方案）

### 其他配置
10. `.dockerignore` - 优化构建上下文
    - ⚠️ **重要**：需要从 `.dockerignore` 中移除 `pnpm-lock.yaml` 这一行

## 验证步骤

### 本地测试

1. **配置 hosts 文件**（开发环境）：
   ```bash
   # Windows: C:\Windows\System32\drivers\etc\hosts
   # Linux/Mac: /etc/hosts
   127.0.0.1 web.example.com
   127.0.0.1 docs.example.com
   ```

2. **测试 turbo prune**：
   ```bash
   cd /path/to/project
   # 使用完整的包名
   pnpm turbo prune @repo/web --docker
   # 检查 out/ 目录结构
   ```

3. **构建应用**：
   ```bash
   # 构建 Web 应用
   docker build --build-arg APP_NAME=web -f apps/web/Dockerfile -t web:test .
   
   # 构建 Docs 应用
   docker build --build-arg APP_NAME=docs -f apps/docs/Dockerfile -t docs:test .
   ```

### 集成测试

```bash
# 启动所有服务（包括 nginx-proxy）
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f web docs nginx-proxy

# 健康检查（通过域名访问）
curl -H "Host: web.example.com" http://localhost
curl -H "Host: docs.example.com" http://localhost

# 或直接访问（如果已配置 hosts）
curl http://web.example.com
curl http://docs.example.com
```

### 访问验证

1. **Web 应用**：
   - 浏览器访问 `http://web.example.com`
   - 测试 SPA 路由（如 `http://web.example.com/sign-in`）
   - 测试 API 代理（如 `http://web.example.com/api/auth/login`）

2. **Docs 应用**：
   - 浏览器访问 `http://docs.example.com`
   - 测试 SPA 路由
   - 测试 API 代理

3. **验证 API 代理**：
   ```bash
   # 测试 API 代理是否正常工作
   curl -H "Host: web.example.com" http://localhost/api/health
   ```

## 常见问题排查

### 问题 1：构建失败 - 找不到 pnpm-lock.yaml

**错误信息**：
```
Error: Cannot find pnpm-lock.yaml
```

**原因**：`.dockerignore` 文件中忽略了 `pnpm-lock.yaml`

**解决方案**：
1. 打开 `.dockerignore` 文件
2. 找到并删除 `pnpm-lock.yaml` 这一行
3. 重新构建

### 问题 2：turbo prune 失败 - 找不到包

**错误信息**：
```
Error: Cannot find package @repo/web
```

**原因**：
- 使用了错误的包名（如 `web` 而不是 `@repo/web`）
- 或者没有复制必要的文件（如 `apps/web/package.json`）

**解决方案**：
- 确保使用完整的包名：`@repo/${APP_NAME}`
- 确保 Dockerfile 中复制了 `apps/${APP_NAME}/package.json`

### 问题 3：构建失败 - 找不到 workspace 依赖

**错误信息**：
```
Error: Cannot find module @repo/ui
```

**原因**：`turbo prune` 没有正确识别 workspace 依赖

**解决方案**：
- 确保复制了所有 `packages` 目录（即使最终只使用部分包）
- 确保 `pnpm-workspace.yaml` 已复制
- 确保 `turbo.json` 已复制

## 注意事项

1. **构建上下文和包名**：
   - Dockerfile 的构建上下文必须是**项目根目录**（`.`）
   - 这样才能访问所有 workspace 包进行 prune
   - 在 docker-compose 中设置：`context: .` 和 `dockerfile: apps/web/Dockerfile`
   - **包名使用**：
     - `APP_NAME` 参数值：`web` 或 `docs`（应用目录名）
     - `turbo prune` 命令：必须使用 `@repo/${APP_NAME}`（完整包名）
     - `turbo run build --filter` 命令：必须使用 `@repo/${APP_NAME}`（完整包名）
     - 文件路径：使用 `${APP_NAME}`（如 `apps/${APP_NAME}/package.json`）

2. **pnpm 和 Turborepo 版本**：
   - 必须使用 `pnpm@10.28.0`（与项目要求一致）
   - 使用 `corepack` 启用和准备 pnpm 版本
   - 必须安装 `turbo@2.7.4`（项目依赖，通过 `pnpm install` 自动安装）
   - 需要复制 `turbo.json` 到构建镜像（Turborepo 配置文件）
   - **重要**：`turbo prune` 和 `turbo run build --filter` 必须使用完整的包名（如 `@repo/web` 而不是 `web`）

3. **Node 版本**：
   - 必须使用 `node:22-alpine`（项目要求 >= 22）
   - 当前 Dockerfile 使用 `node:20-alpine` 是错误的

4. **缓存优化**：
   - 先复制 `package.json`、`pnpm-lock.yaml` 和 `turbo.json`，再安装依赖
   - 利用 Docker 层缓存，避免依赖变更时重新复制所有文件
   - Turborepo 的构建缓存可以进一步加速构建（在 Docker 层缓存基础上）
   - 注意：Turborepo 的远程缓存已禁用（`remoteCache.enabled: false`），只使用本地缓存
   - **重要**：`.dockerignore` 中不应该忽略 `pnpm-lock.yaml`，构建时需要 lockfile 来确保依赖版本一致
   - ⚠️ **当前 `.dockerignore` 文件忽略了 `pnpm-lock.yaml`，需要手动移除这一行**

5. **镜像大小**：
   - 使用多阶段构建，最终镜像只包含 Nginx 和静态文件（约 40MB）
   - 比 Node.js 服务器方案小 5 倍以上

6. **多级域名配置**：
   - 所有前端应用使用同一端口（80），不暴露到主机（使用 `expose` 而非 `ports`）
   - 通过 Nginx 反向代理根据域名路由：
     - `web.example.com` → `web:80`
     - `docs.example.com` → `docs:80`
   - Nginx 反向代理暴露 80/443 端口到主机
   - **生产环境**：需要配置 DNS 解析
   - **开发环境**：使用 `/etc/hosts` 文件模拟域名
   - 支持 HTTPS（在反向代理层统一配置 SSL）
   - 易于扩展：添加新应用只需添加新的 server 块和域名

7. **环境变量**：
   - `VITE_*` 环境变量需要在构建时设置（通过 `ARG` 和 `ENV`）
   - 运行时无法修改（已打包到 JS 文件中）
   - 推荐使用相对路径 `/api/*`，通过 Nginx 代理

8. **API 地址配置**：
   - ✅ **推荐**：前端代码使用相对路径 `/api/*`，通过 Nginx 代理转发到 `api-gateway:8080`
   - ✅ Nginx 配置已包含 API 代理（`location /api`）
   - ✅ 确保前端应用和 API 网关在同一 Docker 网络
   - ⚠️ 如果使用绝对 URL，需要在构建时通过 `VITE_API_BASE_URL` 环境变量注入

9. **依赖管理**：
   - 构建阶段需要安装所有 workspace 依赖
   - 最终镜像不需要 `node_modules`（所有依赖已打包到 JS 文件中）
   - 最终镜像不需要 Node.js 运行时（Nginx 静态服务）

10. **Turborepo 版本**：
    - 确保使用项目要求的 Turborepo 版本（2.7.4）
    - `turbo prune` 命令在不同版本间可能有差异

11. **.dockerignore 配置**：
    - ⚠️ **当前 `.dockerignore` 文件忽略了 `pnpm-lock.yaml`**
    - ✅ **必须从 `.dockerignore` 中移除 `pnpm-lock.yaml` 这一行**
    - ✅ 构建时需要 lockfile 来确保依赖版本一致（使用 `--frozen-lockfile` 标志）
    - ✅ 如果 lockfile 变更，应该让 Docker 层缓存失效（这是正确的行为）

12. **Prune 阶段文件复制**：
    - 需要复制所有 `packages` 目录，以便 `turbo prune` 能够分析完整的依赖关系
    - 虽然复制了所有 packages，但 `turbo prune` 只会保留目标应用实际依赖的包到 `out/` 目录
    - 这确保了依赖分析的准确性，同时最终镜像只包含必要的文件
    - **优化说明**：复制整个 `packages` 目录是必要的，因为：
      - `turbo prune` 需要访问所有 workspace 包的 `package.json` 来分析依赖图
      - 只有复制了完整的 packages 结构，`turbo prune` 才能正确识别哪些包是必需的
      - 最终 `out/full/` 目录只包含实际需要的包，不会包含所有 packages

## 最佳实践总结

### 1. 使用 turbo prune
- ✅ 创建精简 monorepo，只包含必要依赖
- ✅ 使用 `--docker` 标志优化层缓存
- ✅ 避免无关变更导致缓存失效

### 2. 多阶段构建
- ✅ 分离依赖安装、构建和运行阶段
- ✅ 最终镜像只包含运行时文件
- ✅ 利用 Docker 层缓存

### 3. Nginx 配置
- ✅ 支持 SPA 路由（`try_files`）
- ✅ 启用 Gzip 压缩
- ✅ 配置静态资源缓存
- ✅ 添加安全头
- ✅ API 代理配置（在反向代理层统一处理）

### 4. 多级域名部署
- ✅ 统一使用 80/443 端口
- ✅ 通过域名路由，易于扩展
- ✅ 统一 SSL/HTTPS 配置
- ✅ 更好的用户体验

## 性能优化建议

1. **使用 BuildKit 缓存挂载**（可选）：
   ```dockerfile
   RUN --mount=type=cache,target=/root/.pnpm-store \
       pnpm install --frozen-lockfile
   ```

2. **启用 Turborepo 远程缓存**（CI/CD）：
   - 在 `turbo.json` 中配置远程缓存
   - 加速 CI/CD 构建

3. **CDN 集成**：
   - 将静态资源部署到 CDN
   - 进一步减少服务器负载

4. **镜像大小优化**：
   - 使用 `nginx:alpine`（约 40MB）
   - 多阶段构建确保最终镜像最小

## 参考资源

- [Turborepo Docker 部署指南](https://turbo.build/repo/docs/handbook/deploying-with-docker)
- [turbo prune 文档](https://turbo.build/docs/reference/prune)
- [React Router Nginx 部署](https://reactrouter.com/how-to/deployment)
- [Nginx SPA 配置最佳实践](https://nginx.org/en/docs/)
- [Docker 多阶段构建最佳实践](https://docs.docker.com/build/building/multi-stage/)
