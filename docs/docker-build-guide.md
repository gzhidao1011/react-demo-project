# Docker 构建和部署指南

## 问题：静态资源不是最新的

### 问题原因

在 `docker-compose.prod.yml` 中，前端应用同时配置了 `image` 和 `build`：

```yaml
web:
  image: ${REGISTRY:-gzhidao1010}/web:${TAG:-latest}
  build:
    context: .
    dockerfile: apps/web/Dockerfile
```

**Docker Compose 的行为**：
- ✅ 如果镜像**不存在**，会使用 `build` 配置进行构建
- ❌ 如果镜像**已存在**，会直接使用旧镜像，**不会重新构建**

因此，当你修改了代码后，如果镜像已经存在，Docker Compose 会使用旧的镜像，导致静态资源不是最新的。

## 解决方案

### 方案 1：强制重新构建（推荐）

使用 `--build` 参数强制重新构建所有服务：

```bash
# 重新构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 只重新构建特定服务
docker-compose -f docker-compose.prod.yml up -d --build web docs storybook
```

**优点**：
- ✅ 简单直接
- ✅ 确保使用最新代码
- ✅ 不需要手动删除镜像

**缺点**：
- ⚠️ 构建时间较长（首次构建或依赖变化时）

### 方案 2：先删除镜像再启动

```bash
# 停止并删除容器
docker-compose -f docker-compose.prod.yml down

# 删除旧镜像
docker rmi gzhidao1010/web:latest
docker rmi gzhidao1010/docs:latest
docker rmi gzhidao1010/storybook:latest

# 重新启动（会自动构建）
docker-compose -f docker-compose.prod.yml up -d
```

**或者批量删除**：

```bash
# 删除所有前端镜像
docker images | findstr "gzhidao1010" | findstr -E "(web|docs|storybook)" | awk '{print $3}' | xargs docker rmi -f
```

**PowerShell 版本**：

```powershell
# 删除所有前端镜像
docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "gzhidao1010/(web|docs|storybook)" | ForEach-Object { docker rmi $_ -f }
```

### 方案 3：使用版本标签（最佳实践）

使用不同的标签来区分版本，避免覆盖：

```bash
# 使用时间戳或版本号作为标签
export TAG=$(date +%Y%m%d-%H%M%S)
# 或
export TAG=v1.0.0

# 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

**优点**：
- ✅ 保留历史版本
- ✅ 可以快速回滚
- ✅ 适合生产环境

### 方案 4：修改配置，移除 image（仅本地开发）

如果只在本地开发，可以移除 `image` 配置，只使用 `build`：

```yaml
web:
  # 移除 image 配置，只使用 build
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      APP_NAME: web
  container_name: web
  # ...
```

**注意**：这种方式每次都会重新构建，适合开发环境。

## 推荐工作流程

### 开发环境

```bash
# 1. 修改代码后，强制重新构建前端应用
docker-compose -f docker-compose.prod.yml up -d --build web docs storybook

# 2. 查看构建日志
docker-compose -f docker-compose.prod.yml logs -f web
```

### 生产环境

```bash
# 1. 使用版本标签
export TAG=v1.0.0

# 2. 构建并推送镜像到仓库
docker-compose -f docker-compose.prod.yml build web docs storybook
docker push gzhidao1010/web:${TAG}
docker push gzhidao1010/docs:${TAG}
docker push gzhidao1010/storybook:${TAG}

# 3. 部署（使用指定标签）
docker-compose -f docker-compose.prod.yml up -d
```

## 快速检查脚本

创建 `scripts/rebuild-frontend.ps1`：

```powershell
# 重新构建前端应用
Write-Host "正在重新构建前端应用..." -ForegroundColor Cyan

# 停止前端容器
docker-compose -f docker-compose.prod.yml stop web docs storybook

# 删除旧镜像
Write-Host "删除旧镜像..." -ForegroundColor Yellow
docker rmi gzhidao1010/web:latest -f 2>$null
docker rmi gzhidao1010/docs:latest -f 2>$null
docker rmi gzhidao1010/storybook:latest -f 2>$null

# 重新构建并启动
Write-Host "重新构建并启动..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d --build web docs storybook

# 查看日志
Write-Host "查看构建日志..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml logs -f web docs storybook
```

**使用方法**：

```powershell
.\scripts\rebuild-frontend.ps1
```

## 验证构建结果

### 检查镜像构建时间

```bash
# 查看镜像信息
docker images gzhidao1010/web:latest

# 查看镜像构建历史
docker history gzhidao1010/web:latest
```

### 检查容器内的文件

```bash
# 进入容器检查文件
docker exec -it web sh

# 查看构建产物
ls -la /usr/share/nginx/html/

# 检查文件修改时间
stat /usr/share/nginx/html/index.html
```

### 检查浏览器缓存

如果镜像已更新但浏览器仍显示旧内容：

1. **清除浏览器缓存**：Ctrl+Shift+Delete
2. **硬刷新**：Ctrl+F5 或 Ctrl+Shift+R
3. **检查 HTTP 响应头**：
   ```bash
   curl -I http://localhost:8888
   ```

## 常见问题

### Q1: 为什么构建很慢？

**原因**：
- 首次构建需要下载依赖
- Docker 层缓存未命中
- 源代码变化导致重新构建

**优化**：
- 使用 `.dockerignore` 排除不必要的文件
- 利用 Docker 层缓存（依赖层不变时）
- 使用多阶段构建（已实现）

### Q2: 如何只更新特定应用？

```bash
# 只更新 web 应用
docker-compose -f docker-compose.prod.yml up -d --build web
```

### Q3: 如何查看构建进度？

```bash
# 实时查看构建日志
docker-compose -f docker-compose.prod.yml build --progress=plain web

# 或使用详细输出
docker-compose -f docker-compose.prod.yml build --no-cache web
```

### Q4: 构建失败怎么办？

```bash
# 查看详细错误信息
docker-compose -f docker-compose.prod.yml build --no-cache web

# 检查 Dockerfile
cat apps/web/Dockerfile

# 手动构建调试
docker build -f apps/web/Dockerfile --build-arg APP_NAME=web -t test-web .
```

## 最佳实践总结

1. **开发环境**：使用 `--build` 参数确保使用最新代码
2. **生产环境**：使用版本标签，避免覆盖
3. **CI/CD**：自动构建和推送镜像，使用版本标签
4. **本地测试**：修改代码后记得重新构建
5. **缓存优化**：合理使用 `.dockerignore` 和 Docker 层缓存

## 相关文档

- [Docker Compose 配置分析](./docker-compose-analysis.md)
- [部署与发布规范](../.cursor/rules/12-部署与发布规范.mdc)
