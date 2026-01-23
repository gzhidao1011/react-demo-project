# 参数：应用名称
ARG APP_NAME=docs

# 阶段1：使用 turbo prune 创建精简 monorepo
FROM node:22-alpine AS pruner
ARG APP_NAME=docs
WORKDIR /app
# 复制必要的文件用于 prune
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# 添加 .npmrc 文件（turbo.json globalDependencies）
COPY .npmrc ./
# 添加 biome.json（turbo.json globalDependencies）
COPY biome.json ./
# 复制目标应用的完整源代码（turbo prune 需要完整的应用代码）
COPY apps/${APP_NAME} ./apps/${APP_NAME}/
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
ARG APP_NAME=docs
WORKDIR /app
# 启用 pnpm（构建需要）
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
# 复制依赖
COPY --from=installer /app/node_modules ./node_modules
# 复制 pruned 的源代码（包含 .npmrc、pnpm-lock.yaml、pnpm-workspace.yaml 等）
COPY --from=pruner /app/out/full/ .
# 验证文件结构（调试用，可以注释掉）
RUN ls -la /app/apps/${APP_NAME}/app/ || echo "Warning: app directory not found"
# 构建应用（使用 Turborepo，使用完整的包名）
# 注意：工作目录是 /app，React Router 会在 apps/docs/app/ 目录下查找 root.tsx
RUN pnpm turbo run build --filter=@repo/${APP_NAME}

# 阶段4：Nginx 生产镜像
FROM nginx:alpine
ARG APP_NAME=docs
# 复制构建产物
COPY --from=builder /app/apps/${APP_NAME}/build/client /usr/share/nginx/html
# 复制 Nginx 配置
COPY apps/${APP_NAME}/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
