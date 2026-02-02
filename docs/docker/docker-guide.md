# Docker 构建和部署指南

本文档整合了 Docker 构建、部署和故障排除的完整指南。

## 目录

- [快速开始](#快速开始)
- [构建与部署](#构建与部署)
- [静态资源不是最新](#静态资源不是最新)
- [推荐工作流程](#推荐工作流程)
- [配置参考](#配置参考)
- [常见问题](#常见问题)

## 快速开始

### 开发环境

```bash
# 启动所有服务（本地构建）
docker-compose up -d

# 仅启动基础设施（MySQL、Redis、Nacos、Sentinel）
docker-compose up -d mysql redis nacos sentinel
```

### 生产环境

```bash
# 设置镜像仓库和版本（可选）
export REGISTRY=your-registry.com/namespace
export TAG=v1.0.0

# 设置密码（推荐）
export MYSQL_ROOT_PASSWORD=your-secure-password
export REDIS_PASSWORD=your-redis-password

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

## 构建与部署

### 首次构建

```bash
# 构建 Java 服务 jar 包
cd services
mvn clean package -DskipTests
cd ..

# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build
```

### 仅更新前端应用

```bash
# 强制重新构建前端应用
docker-compose -f docker-compose.prod.yml up -d --build web storybook
```

## 静态资源不是最新

### 问题原因

在 `docker-compose.prod.yml` 中，前端应用同时配置了 `image` 和 `build`。Docker Compose 在镜像已存在时会直接使用旧镜像，**不会重新构建**。

### 解决方案

#### 方案 1：强制重新构建（推荐）

```bash
docker-compose -f docker-compose.prod.yml up -d --build web storybook
```

#### 方案 2：使用版本标签（生产环境最佳实践）

```bash
export TAG=v1.0.0
docker-compose -f docker-compose.prod.yml up -d --build
```

#### 方案 3：先删除镜像再启动

```bash
docker-compose -f docker-compose.prod.yml down
docker rmi gzhidao1010/web:latest gzhidao1010/storybook:latest -f
docker-compose -f docker-compose.prod.yml up -d
```

## 推荐工作流程

### 开发环境

```bash
# 修改代码后，强制重新构建前端应用
docker-compose -f docker-compose.prod.yml up -d --build web storybook

# 查看构建日志
docker-compose -f docker-compose.prod.yml logs -f web
```

### 生产环境

```bash
# 1. 使用版本标签
export TAG=v1.0.0

# 2. 构建并推送镜像
docker-compose -f docker-compose.prod.yml build web storybook
docker push gzhidao1010/web:${TAG}
docker push gzhidao1010/storybook:${TAG}

# 3. 部署
docker-compose -f docker-compose.prod.yml up -d
```

## 配置参考

Docker Compose 配置文件说明请参见 [docker-compose-reference.md](./docker-compose-reference.md)。

## 常见问题

### Q1: 为什么构建很慢？

- 首次构建需要下载依赖
- Docker 层缓存未命中
- 使用 `.dockerignore` 排除不必要的文件

### Q2: 如何只更新特定应用？

```bash
docker-compose -f docker-compose.prod.yml up -d --build web
```

### Q3: 构建失败怎么办？

```bash
# 查看详细错误
docker-compose -f docker-compose.prod.yml build --no-cache web

# 手动构建调试
docker build -f apps/web/Dockerfile --build-arg APP_NAME=web -t test-web .
```

### Q4: 浏览器仍显示旧内容？

1. 清除浏览器缓存：Ctrl+Shift+Delete
2. 硬刷新：Ctrl+F5
3. 检查 HTTP 响应头：`curl -I http://localhost:8888`

## 相关文档

- [Docker Compose 配置参考](./docker-compose-reference.md)
- [故障排除](../troubleshooting.md)
- [本地开发指南](../local-development-guide.md)
- [部署与发布规范](../../.cursor/rules/12-部署与发布规范.mdc)
