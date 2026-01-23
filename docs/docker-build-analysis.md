# Docker 构建步骤问题分析报告

## 概述

本文档分析了 `docs/frontend-docker-deployment.md` 中的构建步骤与实际项目配置之间的差异，识别出多个严重问题。

## 严重问题清单

### 1. ❌ Dockerfile 配置完全错误

**问题位置**：`apps/web/Dockerfile` 和 `apps/docs/Dockerfile`

**当前状态**：
```dockerfile
FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci
```

**问题**：
1. ❌ **Node 版本错误**：使用 `node:20-alpine`，但项目要求 `>= 22`（`package.json` 中 `engines.node: ">=22"`）
2. ❌ **包管理器错误**：使用 `npm`，但项目使用 `pnpm workspace`（`packageManager: "pnpm@10.28.0"`）
3. ❌ **未使用 turbo prune**：没有利用 Turborepo 的 `turbo prune` 优化构建
4. ❌ **未考虑 monorepo 结构**：直接复制整个项目，没有处理 workspace 依赖
5. ❌ **运行时错误**：使用 Node.js 运行时（`npm run start`），但文档建议使用 Nginx 静态服务
6. ❌ **构建命令错误**：使用 `npm run build`，但应该使用 `pnpm turbo run build --filter=@repo/{app}`
7. ❌ **构建上下文错误**：Dockerfile 在应用目录，但构建上下文应该是项目根目录

**影响**：
- 构建会失败（Node 版本不匹配）
- 依赖安装会失败（使用 npm 而不是 pnpm）
- 无法正确处理 workspace 依赖
- 镜像体积过大（包含不必要的文件）
- 无法利用 Docker 层缓存优化

### 2. ❌ docker-compose.yml 缺少前端服务

**问题位置**：`docker-compose.yml`

**当前状态**：
- 只有后端服务（mysql, nacos, sentinel, user-service, order-service, api-gateway）
- 缺少 `web` 服务
- 缺少 `docs` 服务
- 缺少 `nginx-proxy` 反向代理服务

**影响**：
- 无法通过 Docker Compose 启动前端应用
- 无法实现多级域名部署方案
- 无法统一管理前后端服务

### 3. ❌ .dockerignore 配置问题

**问题位置**：`.dockerignore`

**当前状态**：
```
pnpm-lock.yaml
```

**问题**：
- ❌ **忽略了 pnpm-lock.yaml**：但构建时需要 lockfile 来确保依赖版本一致
- ✅ 其他配置基本正确（忽略了 node_modules、build、docs 等）

**影响**：
- 构建时无法使用 lockfile，可能导致依赖版本不一致
- 但文档中建议忽略它，这是矛盾的

**建议**：
- 应该**保留** `pnpm-lock.yaml`，不要忽略它
- 或者使用 `--frozen-lockfile` 标志时必须有 lockfile

### 4. ❌ 缺少 Nginx 配置文件

**问题位置**：文档建议创建但实际不存在

**缺失文件**：
- `apps/web/nginx.conf` - 应用级 Nginx 配置
- `apps/docs/nginx.conf` - 应用级 Nginx 配置
- `docker/nginx/nginx.conf` - Nginx 主配置
- `docker/nginx/conf.d/default.conf` - 反向代理配置

**影响**：
- 无法使用 Nginx 静态服务
- 无法实现多级域名部署
- 无法配置 API 代理

### 5. ⚠️ 构建输出路径验证

**文档说明**：`apps/{app}/build/client/` 用于 Nginx 部署

**实际验证**：
- ✅ React Router 配置：`ssr: false`（SSR 关闭）
- ✅ 构建命令：`react-router build`
- ✅ 输出目录：`build/client/`（静态资源）和 `build/server/`（服务端代码，即使 SSR 关闭也会生成）
- ✅ 文档说明正确

**结论**：构建输出路径说明是正确的。

### 6. ⚠️ turbo prune 命令验证

**文档说明**：使用 `pnpm turbo prune ${APP_NAME} --docker`

**实际验证**：
- ✅ Turborepo 版本：`2.7.4`（支持 `turbo prune`）
- ✅ 命令格式正确：`turbo prune <package> --docker`
- ⚠️ 注意：应该使用 `@repo/web` 而不是 `web` 作为包名

**建议修正**：
```dockerfile
# 应该使用完整的包名
RUN pnpm turbo prune @repo/${APP_NAME} --docker
```

### 7. ⚠️ 构建命令验证

**文档说明**：`pnpm turbo run build --filter=${APP_NAME}`

**实际验证**：
- ✅ 根目录构建命令：`turbo run build`（构建所有应用）
- ✅ 过滤构建命令：`turbo run build --filter=@repo/web`（构建指定应用）
- ⚠️ 文档中使用 `--filter=${APP_NAME}`，但应该使用 `--filter=@repo/${APP_NAME}`

**建议修正**：
```dockerfile
# 应该使用完整的包名
RUN pnpm turbo run build --filter=@repo/${APP_NAME}
```

## 详细问题分析

### 问题 1：Dockerfile 完全不符合项目要求

**根本原因**：
- Dockerfile 可能是从模板复制而来，没有根据项目实际情况调整
- 没有考虑 monorepo 结构和 Turborepo 构建系统

**修复方案**：
按照文档中的 Dockerfile 模板重写，但需要注意：
1. 使用 `node:22-alpine`
2. 使用 `pnpm` 而不是 `npm`
3. 使用 `turbo prune` 优化构建
4. 构建上下文应该是项目根目录（`.`）
5. 使用 Nginx 静态服务而不是 Node.js 运行时

### 问题 2：docker-compose.yml 缺少前端服务

**根本原因**：
- docker-compose.yml 只配置了后端服务
- 前端服务可能计划单独部署或使用其他方式

**修复方案**：
按照文档添加 `web`、`docs` 和 `nginx-proxy` 服务配置。

### 问题 3：.dockerignore 忽略了 lockfile

**根本原因**：
- 可能是为了避免 lockfile 变更导致缓存失效
- 但构建时需要 lockfile 来确保依赖版本一致

**修复方案**：
- **保留** `pnpm-lock.yaml`，不要忽略它
- 使用 `--frozen-lockfile` 标志确保依赖版本一致
- 如果 lockfile 变更，应该让 Docker 层缓存失效（这是正确的行为）

### 问题 4：缺少 Nginx 配置

**根本原因**：
- 文档是新写的，但实际文件还没有创建
- 需要按照文档创建这些配置文件

**修复方案**：
按照文档创建所有 Nginx 配置文件。

## 修复优先级

### 🔴 高优先级（阻塞构建）

1. **修复 Dockerfile**：
   - 使用正确的 Node 版本（22）
   - 使用 pnpm 而不是 npm
   - 使用 turbo prune 优化构建
   - 使用 Nginx 静态服务

2. **修复构建命令**：
   - 使用 `--filter=@repo/${APP_NAME}` 而不是 `--filter=${APP_NAME}`

### 🟡 中优先级（影响部署）

3. **更新 docker-compose.yml**：
   - 添加 web、docs 和 nginx-proxy 服务

4. **创建 Nginx 配置文件**：
   - 创建所有必需的 Nginx 配置文件

### 🟢 低优先级（优化）

5. **优化 .dockerignore**：
   - 保留 `pnpm-lock.yaml`，不要忽略它

## 修复建议

### 1. 立即修复 Dockerfile

按照文档模板重写，但修正以下问题：

```dockerfile
# 修正 1：使用完整的包名
RUN pnpm turbo prune @repo/${APP_NAME} --docker

# 修正 2：使用完整的包名过滤
RUN pnpm turbo run build --filter=@repo/${APP_NAME}
```

### 2. 更新 docker-compose.yml

添加前端服务配置（按照文档）。

### 3. 创建 Nginx 配置文件

按照文档创建所有必需的配置文件。

### 4. 更新 .dockerignore

移除 `pnpm-lock.yaml` 的忽略规则。

## 验证步骤

修复后，按照以下步骤验证：

1. **测试 turbo prune**：
   ```bash
   pnpm turbo prune @repo/web --docker
   # 检查 out/ 目录结构
   ```

2. **测试 Docker 构建**：
   ```bash
   docker build --build-arg APP_NAME=web -f apps/web/Dockerfile -t web:test .
   ```

3. **测试 Docker Compose**：
   ```bash
   docker-compose up -d web docs nginx-proxy
   ```

4. **验证服务**：
   ```bash
   curl -H "Host: web.example.com" http://localhost
   curl -H "Host: docs.example.com" http://localhost
   ```

## 总结

文档中的构建步骤方案是**正确的**，但存在一些细节需要修正：

1. ✅ 整体架构设计合理（使用 turbo prune、多阶段构建、Nginx 静态服务）
2. ⚠️ 需要修正包名（使用 `@repo/web` 而不是 `web`）
3. ❌ 实际 Dockerfile 完全不符合要求，需要重写
4. ❌ docker-compose.yml 缺少前端服务配置
5. ❌ 缺少 Nginx 配置文件
6. ⚠️ .dockerignore 应该保留 lockfile

**建议**：按照文档方案实施，但修正上述细节问题。
