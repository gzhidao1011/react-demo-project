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
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 说明：构建统一的 Storybook 静态站点（展示所有包的组件）
RUN pnpm turbo run build-storybook --filter=@repo/storybook

FROM nginx:alpine

COPY --from=builder /app/apps/storybook/storybook-static /usr/share/nginx/html
COPY apps/storybook/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
