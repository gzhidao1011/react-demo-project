FROM node:22-alpine AS pruner
WORKDIR /app

# 说明：Storybook 构建需要在 monorepo 上下文里运行（依赖 packages/ui、propel、tailwind-config 等）。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY .npmrc ./
COPY biome.json ./
COPY apps/storybook ./apps/storybook
COPY packages ./packages

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --frozen-lockfile

# 说明：精简构建上下文，只保留 @repo/storybook 相关依赖
RUN pnpm turbo prune @repo/storybook --docker

FROM node:22-alpine AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
# 先复制 pruned 的源代码和配置文件（包含 .npmrc、pnpm-workspace.yaml 等）
COPY --from=pruner /app/out/full/ .
# 复制 pnpm-lock.yaml（turbo prune 会生成到 out/pnpm-lock.yaml，需要显式复制）
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# 复制依赖
COPY --from=installer /app/node_modules ./node_modules
# 重新安装以建立 workspace 包的链接
# 这对于 pnpm workspace 环境很重要，确保 workspace 包正确链接到 node_modules
# Storybook 依赖 @repo/ui、@repo/propel、@repo/tailwind-config 等 workspace 包
# 使用 --prefer-offline 优先使用已安装的包，避免重新下载，只重新链接 workspace 包
# 使用 --frozen-lockfile 确保版本一致
RUN pnpm install --frozen-lockfile --prefer-offline

# 说明：构建统一的 Storybook 静态站点（展示所有包的组件）
RUN pnpm turbo run build-storybook --filter=@repo/storybook

FROM nginx:alpine

COPY --from=builder /app/apps/storybook/storybook-static /usr/share/nginx/html
COPY apps/storybook/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
