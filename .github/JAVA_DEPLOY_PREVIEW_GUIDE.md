# Java 微服务部署预览指南

> **📌 提示**：如果您需要预览**前端 + 后端**的完整环境，请参考 [统一部署预览指南](./UNIFIED_DEPLOY_PREVIEW_GUIDE.md)。

本文档说明如何为 Java 微服务配置部署预览，在合并 PR 之前预览实际运行效果。

## 🎯 Java 服务部署预览的特点

Java 微服务的部署预览与前端应用不同：

- ⚠️ **需要完整环境**：需要数据库、注册中心（Nacos）等基础设施
- ⚠️ **启动时间较长**：Java 服务启动通常需要 30-60 秒
- ⚠️ **资源消耗较大**：需要运行多个容器（MySQL、Nacos、Sentinel、微服务等）
- ✅ **真实环境**：预览环境与实际生产环境一致

## 📋 部署预览方案对比

| 方案 | 配置难度 | 资源需求 | 启动时间 | 推荐度 |
|------|---------|---------|---------|--------|
| **Docker 本地预览** | ⭐⭐ 中等 | 本地 Docker | 5-10 分钟 | ⭐⭐⭐⭐⭐ |
| **GitHub Actions + 临时服务器** | ⭐⭐⭐⭐ 复杂 | 云服务器 | 10-15 分钟 | ⭐⭐⭐ |
| **云服务临时环境** | ⭐⭐⭐ 中等 | 云服务资源 | 10-15 分钟 | ⭐⭐⭐⭐ |

## 🐳 方案 1：Docker 本地预览（推荐）

这是最实用的方案，可以在本地完整预览 Java 微服务的运行效果。

### 前置要求

- ✅ Docker 和 Docker Compose 已安装
- ✅ 本地有足够资源（建议 8GB+ 内存）
- ✅ 端口未被占用（3306, 8848, 8001, 8002, 8080 等）

### 操作步骤

#### 步骤 1：Checkout PR 分支

```bash
# 获取 PR 分支
git fetch origin

# Checkout PR 分支（替换为实际的 PR 分支名）
git checkout feature/user-service-update
```

#### 步骤 2：构建 Java 服务

```bash
# 进入 services 目录
cd services

# 构建所有服务（跳过测试以加快速度）
mvn clean package -DskipTests

# 或者只构建特定服务
mvn clean package -DskipTests -pl user-service -am
```

**注意**：如果 PR 只修改了特定服务，可以只构建该服务以节省时间。

#### 步骤 3：启动预览环境

```bash
# 返回项目根目录
cd ..

# 启动所有服务（包括基础设施和微服务）
docker-compose up -d

# 或者只启动基础设施（如果只需要测试特定服务）
docker-compose up -d mysql nacos sentinel

# 然后单独启动修改的服务
docker-compose up -d user-service
```

#### 步骤 4：等待服务启动

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志（确认服务已启动）
docker-compose logs -f user-service

# 等待看到类似以下日志表示启动成功：
# Started UserServiceApplication in X.XXX seconds
```

**启动时间参考**：
- MySQL: 30-60 秒
- Nacos: 60-90 秒
- 微服务: 30-60 秒（每个服务）

#### 步骤 5：测试服务

**方法 1：使用 curl 测试**

```bash
# 测试用户服务健康检查
curl http://localhost:8001/actuator/health

# 测试用户服务 API（根据实际 API 调整）
curl http://localhost:8001/api/users

# 测试订单服务
curl http://localhost:8002/api/orders

# 测试 API 网关
curl http://localhost:8080/api/users
```

**方法 2：使用浏览器访问**

- **Nacos 控制台**: http://localhost:8848/nacos
  - 用户名/密码: `nacos/nacos`（如果未启用认证）
- **Sentinel 控制台**: http://localhost:8858
  - 用户名/密码: `sentinel/sentinel`
- **API 网关**: http://localhost:8080

**方法 3：使用 Postman/Insomnia**

导入 API 文档，测试各个接口。

#### 步骤 6：查看服务注册情况

访问 Nacos 控制台：
1. 打开 http://localhost:8848/nacos
2. 登录（默认：nacos/nacos）
3. 进入 **服务管理** → **服务列表**
4. 查看服务是否已注册：
   - `user-service`
   - `order-service`
   - `api-gateway`

#### 步骤 7：清理预览环境

预览完成后，清理环境：

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（如果需要完全清理）
docker-compose down -v

# 删除构建的镜像（可选）
docker rmi microservices/user-service:latest
docker rmi microservices/order-service:latest
docker rmi microservices/api-gateway:latest
```

### 快速预览脚本

创建 `scripts/preview-java-service.sh`（Linux/Mac）或 `scripts/preview-java-service.ps1`（Windows）：

**Linux/Mac (`preview-java-service.sh`)**:

```bash
#!/bin/bash

# 获取 PR 分支名（从命令行参数或 git 分支）
BRANCH=${1:-$(git branch --show-current)}

echo "🚀 开始预览 Java 服务 (分支: $BRANCH)"

# 1. Checkout 分支
echo "📦 Checkout 分支..."
git fetch origin
git checkout $BRANCH

# 2. 构建服务
echo "🔨 构建 Java 服务..."
cd services
mvn clean package -DskipTests
cd ..

# 3. 启动服务
echo "🐳 启动 Docker 服务..."
docker-compose up -d

# 4. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 5. 检查服务状态
echo "✅ 检查服务状态..."
docker-compose ps

echo ""
echo "🎉 预览环境已启动！"
echo "📊 Nacos: http://localhost:8848/nacos"
echo "🛡️  Sentinel: http://localhost:8858"
echo "🌐 API Gateway: http://localhost:8080"
echo ""
echo "测试完成后运行: docker-compose down"
```

**Windows (`preview-java-service.ps1`)**:

```powershell
# 获取 PR 分支名
param(
    [string]$Branch = (git branch --show-current)
)

Write-Host "🚀 开始预览 Java 服务 (分支: $Branch)" -ForegroundColor Green

# 1. Checkout 分支
Write-Host "📦 Checkout 分支..." -ForegroundColor Yellow
git fetch origin
git checkout $Branch

# 2. 构建服务
Write-Host "🔨 构建 Java 服务..." -ForegroundColor Yellow
Set-Location services
mvn clean package -DskipTests
Set-Location ..

# 3. 启动服务
Write-Host "🐳 启动 Docker 服务..." -ForegroundColor Yellow
docker-compose up -d

# 4. 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 5. 检查服务状态
Write-Host "✅ 检查服务状态..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🎉 预览环境已启动！" -ForegroundColor Green
Write-Host "📊 Nacos: http://localhost:8848/nacos"
Write-Host "🛡️  Sentinel: http://localhost:8858"
Write-Host "🌐 API Gateway: http://localhost:8080"
Write-Host ""
Write-Host "测试完成后运行: docker-compose down" -ForegroundColor Yellow
```

**使用方法**：

```bash
# Linux/Mac
chmod +x scripts/preview-java-service.sh
./scripts/preview-java-service.sh feature/user-service-update

# Windows PowerShell
.\scripts\preview-java-service.ps1 -Branch feature/user-service-update
```

## ☁️ 方案 2：GitHub Actions + 临时服务器

如果需要在云端预览，可以配置 GitHub Actions 自动部署到临时服务器。

### 配置步骤

#### 步骤 1：准备临时服务器

- 可以使用云服务（AWS EC2、阿里云 ECS、腾讯云 CVM 等）
- 或使用 GitHub Actions 的 self-hosted runner

#### 步骤 2：创建预览工作流

创建 `.github/workflows/java-preview.yml`：

```yaml
name: Java Service Preview

on:
  pull_request:
    branches:
      - main
    paths:
      - 'services/**'

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      
      - name: Build services
        working-directory: ./services
        run: mvn clean package -DskipTests
      
      - name: Build Docker images
        run: |
          docker build -f services/user-service/Dockerfile -t user-service:preview-${{ github.event.pull_request.number }} ./services/user-service
          docker build -f services/order-service/Dockerfile -t order-service:preview-${{ github.event.pull_request.number }} ./services/order-service
          docker build -f services/api-gateway/Dockerfile -t api-gateway:preview-${{ github.event.pull_request.number }} ./services/api-gateway
      
      - name: Deploy to preview server
        # 这里需要配置 SSH 连接到临时服务器
        # 或使用 Docker Hub 推送镜像，然后在服务器上拉取
        run: |
          echo "部署到预览服务器..."
          # 实际部署命令
```

**注意**：这个方案需要：
- 临时服务器资源
- SSH 密钥配置
- 网络访问配置

### 优势

- ✅ 可以在任何地方访问预览
- ✅ 不占用本地资源
- ✅ 可以分享给团队成员

### 劣势

- ❌ 配置复杂
- ❌ 需要服务器资源
- ❌ 成本较高

## 🔧 方案 3：仅预览特定服务

如果 PR 只修改了特定服务，可以只启动该服务及其依赖：

### 示例：只预览 user-service

```bash
# 1. 构建 user-service
cd services
mvn clean package -DskipTests -pl user-service -am
cd ..

# 2. 启动基础设施
docker-compose up -d mysql nacos

# 3. 等待基础设施就绪
sleep 60

# 4. 启动 user-service
docker-compose up -d user-service

# 5. 测试
curl http://localhost:8001/actuator/health
```

### 示例：只预览 API Gateway

```bash
# 1. 构建 api-gateway
cd services
mvn clean package -DskipTests -pl api-gateway -am
cd ..

# 2. 启动完整环境（Gateway 需要所有服务）
docker-compose up -d

# 3. 测试 Gateway
curl http://localhost:8080/api/users
```

## 📊 预览检查清单

预览 Java 服务时，检查以下内容：

### ✅ 服务启动

- [ ] 服务容器正常运行（`docker-compose ps`）
- [ ] 服务日志无错误（`docker-compose logs [service]`）
- [ ] 健康检查通过（`curl http://localhost:8001/actuator/health`）

### ✅ 服务注册

- [ ] 服务已注册到 Nacos（访问 Nacos 控制台查看）
- [ ] 服务状态为健康（绿色）

### ✅ API 功能

- [ ] API 接口正常响应
- [ ] 返回数据格式正确
- [ ] 错误处理正常

### ✅ 服务间调用

- [ ] 服务间调用正常（如果涉及）
- [ ] 网关路由正常（如果使用 Gateway）

### ✅ 数据库连接

- [ ] 数据库连接正常
- [ ] 数据操作正常（增删改查）

## 🎯 实际示例

### 示例 1：预览用户服务更新

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/user-service-update

# 2. 构建 user-service
cd services
mvn clean package -DskipTests -pl user-service -am
cd ..

# 3. 启动环境
docker-compose up -d mysql nacos user-service

# 4. 等待启动（约 2 分钟）
sleep 120

# 5. 测试用户服务
curl http://localhost:8001/api/users
curl http://localhost:8001/api/users/1

# 6. 查看 Nacos 注册情况
# 访问 http://localhost:8848/nacos

# 7. 清理
docker-compose down
```

### 示例 2：预览 API Gateway 路由变更

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/gateway-routes-update

# 2. 构建所有服务（Gateway 需要所有服务）
cd services
mvn clean package -DskipTests
cd ..

# 3. 启动完整环境
docker-compose up -d

# 4. 等待启动（约 3-5 分钟）
sleep 300

# 5. 测试 Gateway 路由
curl http://localhost:8080/api/users
curl http://localhost:8080/api/orders

# 6. 清理
docker-compose down
```

## 💡 最佳实践

1. ✅ **只启动需要的服务**：如果只修改了特定服务，只启动该服务及其依赖
2. ✅ **使用健康检查**：等待服务健康检查通过后再测试
3. ✅ **查看日志**：遇到问题时查看服务日志
4. ✅ **及时清理**：预览完成后及时清理环境，释放资源
5. ✅ **使用脚本**：创建自动化脚本简化操作

## 🔍 故障排除

### 问题 1：服务启动失败

**检查**：
```bash
# 查看服务日志
docker-compose logs user-service

# 检查容器状态
docker-compose ps

# 检查端口占用
netstat -ano | findstr :8001  # Windows
lsof -i :8001  # Mac/Linux
```

**解决方案**：
- 检查端口是否被占用
- 检查数据库连接配置
- 检查 Nacos 连接配置

### 问题 2：服务未注册到 Nacos

**检查**：
- 访问 Nacos 控制台：http://localhost:8848/nacos
- 查看服务列表

**解决方案**：
- 检查 Nacos 连接配置（`application.yml`）
- 确认 Nacos 已启动
- 检查网络连接

### 问题 3：数据库连接失败

**检查**：
```bash
# 检查 MySQL 容器状态
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql

# 测试 MySQL 连接
docker exec -it mysql mysql -uroot -proot123
```

**解决方案**：
- 等待 MySQL 完全启动（通常需要 30-60 秒）
- 检查数据库配置
- 检查网络连接

## 📚 相关文档

- [Docker Compose 配置](../docker-compose.yml)
- [Java 微服务指南](../services/docs/java-microservices-guide.md)
- [Docker 部署文档](../services/docs/docker-deployment.md)
- [部署预览通用指南](./DEPLOY_PREVIEW_GUIDE.md)

## ❓ 常见问题

### Q: 预览需要多长时间？

**A**: 
- 构建服务：2-5 分钟（取决于服务数量）
- 启动环境：3-5 分钟（包括 MySQL、Nacos、微服务）
- 总计：约 5-10 分钟

### Q: 可以同时预览多个 PR 吗？

**A**: 
- 可以，但需要使用不同的端口
- 需要修改 `docker-compose.yml` 使用不同端口
- 或使用不同的 Docker Compose 文件

### Q: 预览环境会影响本地开发吗？

**A**: 
- 如果使用相同端口，会有冲突
- 建议使用不同的端口或不同的 Docker Compose 文件
- 预览完成后及时清理

### Q: 如何加快预览速度？

**A**: 
- 只构建修改的服务（`-pl service-name -am`）
- 只启动需要的服务
- 使用 Docker 镜像缓存
- 跳过测试（`-DskipTests`）
