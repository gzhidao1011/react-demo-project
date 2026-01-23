# Docker 部署方案执行推演报告

## 概述

本文档推演执行 `docs/frontend-docker-deployment.md` 中所有步骤后会产生的结果，包括文件结构、构建过程、服务运行状态和可能遇到的问题。

## 执行步骤推演

### 步骤 1：创建应用级 Nginx 配置文件

**执行操作**：
- 创建 `apps/web/nginx.conf`
- 创建 `apps/docs/nginx.conf`

**执行结果**：

```
项目结构变化：
apps/
├── web/
│   ├── nginx.conf          ← 新建（SPA 路由配置）
│   └── ...
└── docs/
    ├── nginx.conf          ← 新建（SPA 路由配置）
    └── ...
```

**配置文件内容**：
- 监听 80 端口
- 支持 SPA 路由（`try_files`）
- 静态资源缓存（1年）
- Gzip 压缩
- 安全头设置

**状态**：✅ 成功创建

---

### 步骤 2：创建优化的 Dockerfile

**执行操作**：
- 重写 `apps/web/Dockerfile`
- 重写 `apps/docs/Dockerfile`

**执行结果**：

```
apps/
├── web/
│   ├── Dockerfile          ← 重写（多阶段构建）
│   └── ...
└── docs/
    ├── Dockerfile          ← 重写（多阶段构建）
    └── ...
```

**Dockerfile 特点**：
- 4 个构建阶段：pruner → installer → builder → nginx
- 使用 `node:22-alpine`（符合项目要求）
- 使用 `pnpm@10.28.0`
- 使用 `turbo prune @repo/${APP_NAME} --docker`
- 最终镜像：`nginx:alpine` + 静态文件

**状态**：✅ 成功创建

---

### 步骤 3：创建 Nginx 反向代理配置

**执行操作**：
- 创建 `docker/nginx/nginx.conf`
- 创建 `docker/nginx/conf.d/default.conf`
- 创建 `docker/nginx/ssl/` 目录（可选）

**执行结果**：

```
项目结构变化：
docker/
└── nginx/
    ├── nginx.conf          ← 新建（主配置）
    ├── conf.d/
    │   └── default.conf     ← 新建（域名路由）
    └── ssl/                ← 新建（SSL 证书目录，可选）
```

**配置内容**：
- 主配置：Gzip、日志格式、worker 配置
- 反向代理：
  - `web.example.com` → `http://web:80`
  - `docs.example.com` → `http://docs:80`
  - `/api/*` → `http://api-gateway:8080`
  - 默认服务器返回 404

**状态**：✅ 成功创建

---

### 步骤 4：更新 docker-compose.yml

**执行操作**：
- 在 `docker-compose.yml` 中添加 `web`、`docs`、`nginx-proxy` 服务

**执行结果**：

```yaml
services:
  # 现有服务...
  mysql: ...
  nacos: ...
  sentinel: ...
  user-service: ...
  order-service: ...
  api-gateway: ...

  # 新增服务
  web:                    ← 新增
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      args:
        APP_NAME: web
    expose:
      - "80"
    networks:
      - microservices-network

  docs:                   ← 新增
    build:
      context: .
      dockerfile: apps/docs/Dockerfile
      args:
        APP_NAME: docs
    expose:
      - "80"
    networks:
      - microservices-network

  nginx-proxy:            ← 新增
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - web
      - docs
      - api-gateway
    networks:
      - microservices-network
```

**状态**：✅ 成功更新

---

### 步骤 5：更新 docker-compose.prod.yml

**执行操作**：
- 添加生产环境配置（使用远程镜像仓库）

**执行结果**：
- 生产环境配置（具体内容取决于实际需求）
- 可能使用远程镜像仓库而非本地构建

**状态**：⚠️ 需要根据实际情况配置

---

### 步骤 6：优化 .dockerignore

**执行操作**：
- 从 `.dockerignore` 中移除 `pnpm-lock.yaml` 这一行

**当前状态**：
```
.dockerignore (第 54 行)
pnpm-lock.yaml          ← 需要删除
```

**执行后状态**：
```
.dockerignore
# pnpm
# pnpm-lock.yaml         ← 已删除（注释掉或删除）
```

**状态**：⚠️ **必须执行，否则构建会失败**

---

## Docker 构建过程推演

### Web 应用构建（`docker build --build-arg APP_NAME=web -f apps/web/Dockerfile -t web:test .`）

#### 阶段 1：Pruner（精简 monorepo）

**执行过程**：
1. 复制文件到容器：
   ```
   /app/
   ├── package.json
   ├── pnpm-lock.yaml          ← 如果 .dockerignore 已修正，会成功复制
   ├── pnpm-workspace.yaml
   ├── turbo.json
   ├── .npmrc* (如果存在)
   ├── biome.json
   ├── apps/web/package.json
   └── packages/                ← 所有 packages 目录
   ```

2. 安装 pnpm 和依赖：
   ```bash
   corepack enable
   corepack prepare pnpm@10.28.0 --activate
   pnpm install --frozen-lockfile
   ```

3. 执行 turbo prune：
   ```bash
   pnpm turbo prune @repo/web --docker
   ```

**执行结果**：
```
/app/out/
├── json/                      ← 精简的 package.json 文件
│   ├── package.json
│   ├── apps/web/package.json
│   └── packages/
│       ├── ui/package.json
│       ├── utils/package.json
│       ├── services/package.json
│       ├── schemas/package.json
│       └── propel/package.json
├── full/                      ← 完整源代码
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── apps/web/              ← 完整应用代码
│   └── packages/              ← 只包含依赖的包
│       ├── ui/
│       ├── utils/
│       ├── services/
│       ├── schemas/
│       └── propel/
└── pnpm-lock.yaml             ← 精简的 lockfile
```

**可能的问题**：
- ❌ **如果 `.dockerignore` 仍包含 `pnpm-lock.yaml`**：
  - 错误：`Error: Cannot find pnpm-lock.yaml`
  - 构建失败

**状态**：✅ 成功（前提：已修正 .dockerignore）

---

#### 阶段 2：Installer（安装依赖）

**执行过程**：
1. 从 pruner 阶段复制：
   ```
   /app/
   ├── package.json (from out/json/)
   ├── pnpm-lock.yaml (from out/)
   └── ... (所有 out/json/ 中的 package.json)
   ```

2. 安装依赖：
   ```bash
   pnpm install --frozen-lockfile
   ```

**执行结果**：
```
/app/
├── node_modules/              ← 只包含必要的依赖
│   ├── react/
│   ├── react-dom/
│   ├── react-router/
│   └── ... (所有依赖)
└── ...
```

**镜像大小**：约 500-800MB（包含所有依赖）

**状态**：✅ 成功

---

#### 阶段 3：Builder（构建应用）

**执行过程**：
1. 复制依赖：
   ```
   /app/node_modules/          ← 从 installer 阶段
   ```

2. 复制源代码：
   ```
   /app/                        ← 从 pruner 阶段的 out/full/
   ├── apps/web/                ← 完整应用代码
   └── packages/                ← 只包含依赖的包
   ```

3. 构建应用：
   ```bash
   pnpm turbo run build --filter=@repo/web
   ```

**执行结果**：
```
/app/apps/web/build/
├── client/                     ← 静态资源（用于 Nginx）
│   ├── index.html
│   ├── assets/
│   │   ├── index-xxx.js
│   │   ├── index-xxx.css
│   │   └── ...
│   └── ...
└── server/                     ← 服务端代码（不使用）
    └── index.js
```

**可能的问题**：
- ❌ **如果包名错误**（如使用 `web` 而不是 `@repo/web`）：
  - 错误：`Error: Cannot find package @repo/web`
  - 构建失败

- ❌ **如果 workspace 依赖缺失**：
  - 错误：`Error: Cannot find module @repo/ui`
  - 构建失败

**状态**：✅ 成功（前提：包名和依赖正确）

---

#### 阶段 4：Nginx（生产镜像）

**执行过程**：
1. 复制构建产物：
   ```
   /usr/share/nginx/html/       ← 从 builder 阶段的 apps/web/build/client/
   ├── index.html
   └── assets/
   ```

2. 复制 Nginx 配置：
   ```
   /etc/nginx/conf.d/default.conf  ← 从 apps/web/nginx.conf
   ```

**执行结果**：
```
最终镜像内容：
/usr/share/nginx/html/          ← 静态文件
/etc/nginx/conf.d/default.conf  ← Nginx 配置
```

**镜像大小**：约 40-50MB（nginx:alpine + 静态文件）

**状态**：✅ 成功

---

### Docs 应用构建

**执行过程**：与 Web 应用相同，但 `APP_NAME=docs`

**执行结果**：
- 独立的 Docker 镜像：`microservices/docs:latest`
- 镜像大小：约 40-50MB
- 包含 Docs 应用的静态文件

**状态**：✅ 成功

---

## Docker Compose 启动推演

### 执行命令：`docker-compose up -d`

#### 服务启动顺序

1. **基础设施服务**（已存在）：
   - `mysql` - 数据库
   - `nacos` - 注册中心
   - `sentinel` - 监控

2. **后端服务**（已存在）：
   - `user-service` - 用户服务
   - `order-service` - 订单服务
   - `api-gateway` - API 网关

3. **前端服务**（新增）：
   - `web` - Web 应用（等待构建）
   - `docs` - Docs 应用（等待构建）

4. **反向代理**（新增）：
   - `nginx-proxy` - Nginx 反向代理（等待 web、docs、api-gateway）

#### 启动时间线

```
T+0s:   启动基础设施服务（mysql, nacos, sentinel）
T+30s:  基础设施服务就绪
T+30s:  启动后端服务（user-service, order-service, api-gateway）
T+60s:  后端服务就绪
T+60s:  开始构建前端服务（web, docs）
        ├─ Pruner 阶段：~2-3 分钟
        ├─ Installer 阶段：~3-5 分钟
        ├─ Builder 阶段：~2-4 分钟
        └─ Nginx 阶段：~10 秒
T+12m:  前端服务构建完成
T+12m:  启动 nginx-proxy
T+12m:  所有服务就绪
```

**总启动时间**：首次构建约 10-15 分钟（取决于网络和硬件）

---

## 最终系统架构

### 网络拓扑

```
Internet
  ↓
Nginx 反向代理 (nginx-proxy:80/443)
  ├─ web.example.com → web:80
  ├─ docs.example.com → docs:80
  └─ /api/* → api-gateway:8080
      ↓
    Docker 网络 (microservices-network)
      ├─ web (Nginx 静态服务)
      ├─ docs (Nginx 静态服务)
      ├─ api-gateway (Spring Cloud Gateway)
      ├─ user-service (Spring Boot)
      ├─ order-service (Spring Boot)
      ├─ mysql (MySQL 8.0)
      ├─ nacos (Nacos Server)
      └─ sentinel (Sentinel Dashboard)
```

### 服务访问路径

1. **Web 应用**：
   ```
   用户 → http://web.example.com
        → Nginx 反向代理 (nginx-proxy)
        → web:80 (Nginx 静态服务)
        → /usr/share/nginx/html/index.html
   ```

2. **Docs 应用**：
   ```
   用户 → http://docs.example.com
        → Nginx 反向代理 (nginx-proxy)
        → docs:80 (Nginx 静态服务)
        → /usr/share/nginx/html/index.html
   ```

3. **API 请求**：
   ```
   前端 → http://web.example.com/api/auth/login
        → Nginx 反向代理 (nginx-proxy)
        → api-gateway:8080
        → user-service:8001 (或 order-service:8002)
   ```

---

## 可能遇到的问题和结果

### 问题 1：.dockerignore 未修正

**现象**：
```
Step 5/15 : COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY failed: file not found in build context or excluded by .dockerignore
```

**结果**：
- ❌ 构建失败
- 无法继续后续步骤

**解决方案**：
- 从 `.dockerignore` 中移除 `pnpm-lock.yaml`

---

### 问题 2：包名使用错误

**现象**：
```
Step 8/15 : RUN pnpm turbo prune @repo/${APP_NAME} --docker
Error: Cannot find package @repo/web
```

**结果**：
- ❌ Prune 阶段失败
- 构建中断

**解决方案**：
- 确保使用完整的包名：`@repo/web` 而不是 `web`

---

### 问题 3：workspace 依赖缺失

**现象**：
```
Error: Cannot find module @repo/ui
```

**结果**：
- ❌ 构建阶段失败
- 应用无法构建

**解决方案**：
- 确保复制了所有 `packages` 目录
- 确保 `pnpm-workspace.yaml` 已复制

---

### 问题 4：Nginx 配置错误

**现象**：
```
nginx-proxy: nginx: [emerg] invalid number of arguments in "server_name" directive
```

**结果**：
- ❌ nginx-proxy 容器无法启动
- 前端应用无法访问

**解决方案**：
- 检查 `docker/nginx/conf.d/default.conf` 配置
- 确保语法正确

---

### 问题 5：域名解析失败

**现象**：
```
用户访问 http://web.example.com → 无法访问
```

**结果**：
- ⚠️ 开发环境无法访问（生产环境需要 DNS 配置）

**解决方案**：
- 开发环境：配置 `/etc/hosts` 文件
- 生产环境：配置 DNS 解析

---

### 问题 6：API 代理失败

**现象**：
```
前端请求 /api/auth/login → 502 Bad Gateway
```

**结果**：
- ⚠️ API 请求失败
- 前端功能异常

**可能原因**：
- `api-gateway` 服务未启动
- 网络配置错误
- API 网关配置错误

**解决方案**：
- 检查 `api-gateway` 服务状态
- 检查 Docker 网络配置
- 检查 Nginx 代理配置

---

## 成功执行后的最终状态

### 文件结构

```
项目根目录/
├── apps/
│   ├── web/
│   │   ├── Dockerfile          ← 已重写
│   │   ├── nginx.conf          ← 新建
│   │   └── ...
│   └── docs/
│       ├── Dockerfile          ← 已重写
│       ├── nginx.conf          ← 新建
│       └── ...
├── docker/
│   └── nginx/
│       ├── nginx.conf          ← 新建
│       ├── conf.d/
│       │   └── default.conf    ← 新建
│       └── ssl/                ← 新建（可选）
├── docker-compose.yml          ← 已更新（添加 web, docs, nginx-proxy）
├── docker-compose.prod.yml     ← 已更新（生产环境配置）
└── .dockerignore               ← 已更新（移除 pnpm-lock.yaml）
```

### Docker 镜像

```
镜像列表：
- microservices/web:latest      (~40-50MB)
- microservices/docs:latest      (~40-50MB)
- nginx:alpine                   (~40MB，已存在)
- mysql:8.0                     (已存在)
- nacos/nacos-server:v2.3.0     (已存在)
- ... (其他后端服务镜像)
```

### 运行中的容器

```
容器列表：
- web                           (运行中，端口 80，内部访问)
- docs                          (运行中，端口 80，内部访问)
- nginx-proxy                   (运行中，端口 80:80, 443:443)
- api-gateway                   (运行中，端口 8080:8080)
- user-service                  (运行中)
- order-service                 (运行中)
- mysql                         (运行中)
- nacos                         (运行中)
- sentinel                      (运行中)
```

### 访问验证

**成功状态**：
- ✅ `http://web.example.com` → Web 应用首页
- ✅ `http://docs.example.com` → Docs 应用首页
- ✅ `http://web.example.com/sign-in` → SPA 路由正常
- ✅ `http://web.example.com/api/health` → API 代理正常
- ✅ 静态资源加载正常（JS、CSS、图片）
- ✅ Gzip 压缩生效
- ✅ 静态资源缓存生效

---

## 性能指标推演

### 构建性能

- **首次构建**：10-15 分钟
  - Pruner 阶段：2-3 分钟
  - Installer 阶段：3-5 分钟
  - Builder 阶段：2-4 分钟
  - Nginx 阶段：10 秒

- **后续构建**（有缓存）：3-5 分钟
  - Docker 层缓存加速
  - Turborepo 构建缓存加速

### 运行时性能

- **镜像大小**：
  - Web 应用：~40-50MB
  - Docs 应用：~40-50MB
  - 比 Node.js 运行时方案小 5 倍以上

- **内存占用**：
  - Web 容器：~20-30MB（Nginx）
  - Docs 容器：~20-30MB（Nginx）
  - 比 Node.js 运行时方案小 10 倍以上

- **启动时间**：
  - Web 容器：~2-3 秒
  - Docs 容器：~2-3 秒
  - 比 Node.js 运行时方案快 5 倍以上

---

## 总结

### 成功执行的条件

1. ✅ **必须修正 `.dockerignore`**：移除 `pnpm-lock.yaml`
2. ✅ **使用正确的包名**：`@repo/web` 而不是 `web`
3. ✅ **复制所有必要文件**：packages、配置文件等
4. ✅ **Nginx 配置正确**：语法和路径正确
5. ✅ **Docker 网络配置**：所有服务在同一网络
6. ✅ **域名解析**：开发环境配置 hosts，生产环境配置 DNS

### 预期结果

- ✅ 两个前端应用成功构建为 Docker 镜像
- ✅ 通过 Nginx 反向代理实现多级域名部署
- ✅ API 代理正常工作
- ✅ SPA 路由正常工作
- ✅ 静态资源缓存和压缩生效
- ✅ 系统架构清晰，易于扩展

### 潜在风险

- ⚠️ 首次构建时间较长（10-15 分钟）
- ⚠️ 需要手动修正 `.dockerignore`
- ⚠️ 需要配置域名解析（开发/生产环境）
- ⚠️ 需要确保 API 网关正常运行

### 建议

1. **先修正 `.dockerignore`**，再进行构建
2. **先测试单个应用构建**，再构建所有应用
3. **先验证本地访问**，再配置域名
4. **监控构建日志**，及时发现问题
5. **使用 Docker 缓存**，加速后续构建
