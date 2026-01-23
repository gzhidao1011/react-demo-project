# 生产环境 Docker 部署指南

## 错误说明

当使用 `docker-compose.prod.yml` 时，如果遇到以下错误：

```
Error manifest for gzhidao1010/web:latest not found: manifest unknown
```

**原因**：生产环境配置尝试从远程镜像仓库拉取镜像，但这些镜像还没有被构建和推送到仓库。

## 解决方案

### 方案 1：先构建并推送镜像（推荐用于生产环境）

#### 1.1 构建镜像

```bash
# 使用开发环境配置构建镜像
docker-compose build web docs

# 或者直接使用 docker build
docker build --build-arg APP_NAME=web -f apps/web/Dockerfile -t gzhidao1010/web:latest .
docker build --build-arg APP_NAME=docs -f apps/docs/Dockerfile -t gzhidao1010/docs:latest .
```

#### 1.2 登录镜像仓库

```bash
# Docker Hub
docker login

# 或阿里云镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com

# 或 GitHub Container Registry
docker login ghcr.io
```

#### 1.3 推送镜像

```bash
# 推送 Web 应用镜像
docker push gzhidao1010/web:latest

# 推送 Docs 应用镜像
docker push gzhidao1010/docs:latest
```

#### 1.4 使用生产环境配置启动

```bash
# 设置镜像仓库地址（如果需要）
export REGISTRY=gzhidao1010
export TAG=latest

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 方案 2：修改 docker-compose.prod.yml 支持本地构建（临时方案）

如果暂时不想推送镜像，可以修改 `docker-compose.prod.yml` 使其也支持本地构建。

#### 2.1 修改配置

在 `docker-compose.prod.yml` 中，将前端服务的配置改为：

```yaml
# Web 应用（支持本地构建或远程镜像）
web:
  # 优先使用远程镜像，如果不存在则本地构建
  image: ${REGISTRY:-gzhidao1010}/web:${TAG:-latest}
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      APP_NAME: web
  container_name: web
  # ... 其他配置
```

#### 2.2 使用方式

```bash
# 如果镜像不存在，会自动构建
docker-compose -f docker-compose.prod.yml up -d --build
```

### 方案 3：使用开发环境配置（最简单）

如果只是测试，可以直接使用开发环境配置：

```bash
# 使用开发环境配置（自动构建）
docker-compose up -d --build
```

## 完整部署流程

### 步骤 1：构建镜像

```bash
# 构建所有前端应用镜像
docker-compose build web docs

# 验证镜像
docker images | grep -E "web|docs"
```

### 步骤 2：标记镜像

```bash
# 设置镜像仓库地址
export REGISTRY=gzhidao1010  # 替换为你的仓库地址
export TAG=latest            # 或使用版本号，如 v1.0.0

# 标记镜像
docker tag microservices/web:latest ${REGISTRY}/web:${TAG}
docker tag microservices/docs:latest ${REGISTRY}/docs:${TAG}
```

### 步骤 3：推送镜像

```bash
# 登录镜像仓库
docker login

# 推送镜像
docker push ${REGISTRY}/web:${TAG}
docker push ${REGISTRY}/docs:${TAG}
```

### 步骤 4：部署到生产环境

```bash
# 设置环境变量
export REGISTRY=gzhidao1010
export TAG=latest
export MYSQL_ROOT_PASSWORD=your-secure-password

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 镜像仓库配置

### Docker Hub

```bash
# 登录
docker login

# 标记镜像（使用 Docker Hub 用户名）
docker tag microservices/web:latest your-username/web:latest

# 推送
docker push your-username/web:latest
```

### 阿里云容器镜像服务

```bash
# 登录
docker login registry.cn-hangzhou.aliyuncs.com

# 标记镜像
docker tag microservices/web:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/web:latest

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/web:latest
```

### GitHub Container Registry

```bash
# 登录
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 标记镜像
docker tag microservices/web:latest ghcr.io/your-username/web:latest

# 推送
docker push ghcr.io/your-username/web:latest
```

## 修改 docker-compose.prod.yml 使用你的镜像仓库

编辑 `docker-compose.prod.yml`，修改镜像仓库地址：

```yaml
# 定义镜像仓库地址（使用前请修改）
x-registry: &registry "your-registry.com/your-namespace"  # 修改为你的镜像仓库地址
```

或者在启动时通过环境变量指定：

```bash
export REGISTRY=your-registry.com/your-namespace
docker-compose -f docker-compose.prod.yml up -d
```

## 快速测试方案

如果只是想快速测试，可以使用开发环境配置：

```bash
# 使用开发环境配置（自动构建，无需推送镜像）
docker-compose up -d --build
```

## 常见问题

### Q: 如何知道镜像是否已推送到仓库？

A: 可以尝试拉取镜像：

```bash
docker pull gzhidao1010/web:latest
```

如果成功，说明镜像已存在；如果失败，说明需要先推送。

### Q: 可以使用本地构建的镜像吗？

A: 可以，使用开发环境配置 `docker-compose.yml`，它会自动构建镜像。

### Q: 生产环境必须使用远程镜像吗？

A: 不是必须的，但推荐使用远程镜像，因为：
- 更快的部署速度（不需要构建）
- 版本控制（通过标签管理）
- 多服务器部署（所有服务器拉取同一镜像）

### Q: 如何更新生产环境镜像？

A: 

```bash
# 1. 构建新版本
docker-compose build web docs

# 2. 标记新版本
docker tag microservices/web:latest gzhidao1010/web:v1.1.0

# 3. 推送新版本
docker push gzhidao1010/web:v1.1.0

# 4. 更新生产环境
export TAG=v1.1.0
docker-compose -f docker-compose.prod.yml up -d --pull always
```

## 总结

- **开发环境**：使用 `docker-compose.yml`，自动构建镜像
- **生产环境**：使用 `docker-compose.prod.yml`，需要先构建并推送镜像
- **快速测试**：如果镜像不存在，可以先使用开发环境配置
