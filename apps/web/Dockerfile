# 参数：应用名称
ARG APP_NAME=web

# 阶段1：使用 turbo prune 创建精简 monorepo
FROM node:22-alpine AS pruner
ARG APP_NAME=web
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
ARG APP_NAME=web
WORKDIR /app
# 启用 pnpm（构建需要）
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
# 先复制 pruned 的源代码和配置文件（包含 .npmrc、pnpm-workspace.yaml 等）
COPY --from=pruner /app/out/full/ .
# 复制 pnpm-lock.yaml（turbo prune 会生成到 out/pnpm-lock.yaml，需要显式复制）
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# 复制依赖
COPY --from=installer /app/node_modules ./node_modules
# 重新安装以建立 workspace 包的链接
# 这对于 pnpm workspace 环境很重要，确保 workspace 包正确链接到 node_modules
# 使用 --prefer-offline 优先使用已安装的包，避免重新下载，只重新链接 workspace 包
# 使用 --frozen-lockfile 确保版本一致
RUN pnpm install --frozen-lockfile --prefer-offline
# 验证文件结构（调试用，可以注释掉）
RUN ls -la /app/apps/${APP_NAME}/app/ || echo "Warning: app directory not found"
# 验证依赖安装
RUN pnpm list --depth=0 | head -20 || echo "Warning: pnpm list failed"
# 验证 React Router 相关依赖
RUN ls -la /app/node_modules/.pnpm/@react-router* 2>/dev/null || echo "Warning: React Router dependencies not found"
# 验证关键依赖是否存在
RUN test -d /app/node_modules/.pnpm/@react-router+dev* || (echo "Error: @react-router/dev not found" && exit 1)
RUN test -d /app/node_modules/.pnpm/react-router* || (echo "Error: react-router not found" && exit 1)
# 构建应用（使用 Turborepo，使用完整的包名）
# 注意：工作目录是 /app，React Router 会在 apps/web/app/ 目录下查找 root.tsx
# 设置 NODE_ENV 为 production 以确保正确的构建环境
ENV NODE_ENV=production
# 添加详细日志和错误处理
# 使用 Turborepo 构建，并将输出保存到日志文件以便调试
RUN pnpm turbo run build --filter=@repo/${APP_NAME} --verbose 2>&1 | tee /tmp/build.log || (echo "Build failed, showing build log:" && cat /tmp/build.log && echo "Checking build output..." && ls -la /app/apps/${APP_NAME}/build 2>/dev/null || echo "Build directory not found" && exit 1)
# 验证构建产物
RUN test -d /app/apps/${APP_NAME}/build/client || (echo "Error: build/client directory not found" && exit 1)
RUN test -f /app/apps/${APP_NAME}/build/client/index.html || (echo "Error: build/client/index.html not found" && exit 1)

# 阶段4：Nginx 生产镜像
FROM nginx:alpine
ARG APP_NAME=web
# 复制构建产物
COPY --from=builder /app/apps/${APP_NAME}/build/client /usr/share/nginx/html
# 复制 Nginx 配置
COPY apps/${APP_NAME}/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
