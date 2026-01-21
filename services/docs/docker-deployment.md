# Docker 部署指南

本文档详细介绍如何使用 Docker 和 Docker Compose 部署微服务架构项目。

## 目录

- [环境要求](#环境要求)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [服务说明](#服务说明)
- [常用命令](#常用命令)
- [故障排除](#故障排除)
- [发布到远程仓库](#发布到远程仓库)
- [GitHub Actions 自动化](#github-actions-自动化)

## 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Java**: 17+ (用于本地构建)
- **Maven**: 3.8+ (用于本地构建)
- **可用内存**: 至少 4GB（推荐 8GB）

## 项目结构

```
react-demo-project/
├── docker-compose.yml          # Docker Compose 主配置（根目录）
├── .dockerignore               # Docker 构建忽略文件
├── docker/
│   ├── mysql/
│   │   └── init/
│   │       └── 01-init-databases.sql  # MySQL 初始化脚本
│   └── scripts/
│       ├── build.ps1           # 构建脚本 (Windows)
│       ├── start.ps1           # 启动脚本 (Windows)
│       └── stop.ps1            # 停止脚本 (Windows)
└── services/                   # Java 微服务目录
    ├── api-common/             # 公共 API 模块
    ├── user-service/           # 用户服务
    │   ├── Dockerfile
    │   └── src/main/resources/
    │       └── application-docker.yml
    ├── order-service/          # 订单服务
    │   ├── Dockerfile
    │   └── src/main/resources/
    │       └── application-docker.yml
    └── api-gateway/            # API 网关
        ├── Dockerfile
        └── src/main/resources/
            └── application-docker.yml
```

## 快速开始

### 1. 进入项目根目录

```bash
cd react-demo-project
```

### 2. 构建 Java 项目

```bash
cd services
mvn clean package -DskipTests
cd ..
```

### 3. 启动所有服务

```bash
# 启动所有服务（首次会自动构建 Docker 镜像）
docker-compose up -d

# 或使用 PowerShell 脚本（会自动构建 jar 包）
.\docker\scripts\start.ps1 -Mode all -Build -Detach
```

### 4. 查看服务状态

```bash
docker-compose ps
docker-compose logs -f
```

### 5. 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| API 网关 | http://localhost:8080 | 统一入口 |
| 用户服务 | http://localhost:8001 | REST API |
| 订单服务 | http://localhost:8002 | REST API |
| Nacos 控制台 | http://localhost:8848/nacos | 账号: nacos/nacos |
| Sentinel 控制台 | http://localhost:8858 | 账号: sentinel/sentinel |
| MySQL | localhost:3306 | 账号: root/root123 |

### 6. 测试 API

```bash
# 通过网关访问用户服务
curl http://localhost:8080/api/users

# 通过网关创建用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","email":"zhangsan@example.com","phone":"13800138000"}'

# 通过网关访问订单服务
curl http://localhost:8080/api/orders
```

## 服务说明

### 基础设施服务

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| MySQL | mysql:8.0 | 3306 | 数据库 |
| Nacos | nacos/nacos-server:v2.3.0 | 8848, 9848, 9849 | 注册中心/配置中心 |
| Sentinel | bladex/sentinel-dashboard:1.8.6 | 8858 | 流量控制 |

### 业务服务

| 服务 | 端口 | 说明 |
|------|------|------|
| user-service | 8001, 20880 | 用户服务 (HTTP + Dubbo) |
| order-service | 8002, 20881 | 订单服务 (HTTP + Dubbo) |
| api-gateway | 8080 | API 网关 |

## 常用命令

### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 仅启动基础设施
docker-compose up -d mysql nacos sentinel

# 启动并重新构建镜像
docker-compose up -d --build
```

### 查看状态和日志

```bash
# 查看所有容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service-name]

# 查看特定服务日志
docker-compose logs -f user-service
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（清空数据）
docker-compose down -v
```

### 使用 PowerShell 脚本

```powershell
# 构建（包含 jar 包和 Docker 镜像）
.\docker\scripts\build.ps1

# 启动所有服务
.\docker\scripts\start.ps1 -Mode all -Detach

# 启动并重新构建
.\docker\scripts\start.ps1 -Mode all -Build -Detach

# 仅启动基础设施
.\docker\scripts\start.ps1 -Mode infra -Detach

# 停止服务
.\docker\scripts\stop.ps1

# 停止并清除数据
.\docker\scripts\stop.ps1 -RemoveVolumes
```

## 故障排除

### 1. 端口冲突

如果端口已被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "18080:8080"  # 使用其他端口
```

### 2. 服务启动失败

```bash
# 查看服务日志
docker-compose logs user-service

# 重启特定服务
docker-compose restart user-service
```

### 3. 数据库连接失败

确保 MySQL 健康检查通过后再启动业务服务：

```bash
docker-compose up -d mysql
# 等待 MySQL 启动完成
docker-compose up -d
```

### 4. 清理重新开始

```bash
# 停止并删除所有容器、网络、数据卷
docker-compose down -v

# 删除镜像
docker rmi microservices/user-service:latest
docker rmi microservices/order-service:latest
docker rmi microservices/api-gateway:latest

# 重新构建并启动
cd services && mvn clean package -DskipTests && cd ..
docker-compose up -d --build
```

## 健康检查端点

| 服务 | 健康检查 URL |
|------|-------------|
| user-service | http://localhost:8001/actuator/health |
| order-service | http://localhost:8002/actuator/health |
| api-gateway | http://localhost:8080/actuator/health |
| nacos | http://localhost:8848/nacos/v1/console/health/readiness |

---

## 发布到远程仓库

将镜像推送到远程仓库后，其他人可以直接拉取使用，无需本地构建。

### 方案一：Docker Hub（推荐，免费公开）

#### 1. 创建 Docker Hub Access Token

1. 登录 [Docker Hub](https://hub.docker.com)
2. 点击头像 → Account Settings → Security
3. 点击 "New Access Token"
4. 输入描述（如 "microservices-publish"），选择 "Read & Write" 权限
5. 复制生成的 Token（只显示一次！）

#### 2. 配置账号信息（二选一）

**方式 A：使用配置脚本（推荐）**

```powershell
# 运行配置脚本，按提示输入用户名和 Token
.\docker\scripts\setup-dockerhub.ps1
```

**方式 B：手动设置环境变量**

```powershell
# 设置环境变量（当前会话）
$env:DOCKERHUB_USERNAME = "your-username"
$env:DOCKERHUB_TOKEN = "your-access-token"

# 或永久保存到用户环境变量
[System.Environment]::SetEnvironmentVariable("DOCKERHUB_USERNAME", "your-username", "User")
[System.Environment]::SetEnvironmentVariable("DOCKERHUB_TOKEN", "your-access-token", "User")
```

#### 3. 构建并推送

```powershell
# 自动使用环境变量中的账号信息
.\docker\scripts\publish.ps1 -Build -Push

# 或指定 Registry
.\docker\scripts\publish.ps1 -Registry "yourusername" -Build -Push

# 推送指定版本
.\docker\scripts\publish.ps1 -Tag "v1.0.0" -Build -Push
```

#### 4. GitHub Actions 自动发布（CI/CD）

项目已配置 GitHub Actions，推送代码时自动构建并推送镜像。

**配置步骤：**

1. 在 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 添加以下 Secrets：
   - `DOCKERHUB_USERNAME`: Docker Hub 用户名
   - `DOCKERHUB_TOKEN`: Docker Hub Access Token

**触发条件：**
- 推送到 `main` 分支且修改了 `services/` 目录
- 创建版本标签（如 `v1.0.0`）
- 手动触发 workflow

#### 5. 其他人使用

```bash
# 下载 docker-compose.prod.yml 和 docker 目录后
# 设置环境变量
export REGISTRY=yourusername

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 方案二：阿里云容器镜像服务（国内访问快）

#### 1. 创建镜像仓库

1. 访问 [阿里云容器镜像服务](https://cr.console.aliyun.com)
2. 创建命名空间（如 `my-microservices`）
3. 创建镜像仓库（user-service、order-service、api-gateway）

#### 2. 登录并推送

```bash
# 登录阿里云镜像服务
docker login registry.cn-hangzhou.aliyuncs.com

# 标记并推送
docker tag microservices/user-service:latest registry.cn-hangzhou.aliyuncs.com/my-namespace/user-service:latest
docker push registry.cn-hangzhou.aliyuncs.com/my-namespace/user-service:latest
```

#### 3. 使用发布脚本

```powershell
.\docker\scripts\publish.ps1 -Registry "registry.cn-hangzhou.aliyuncs.com/my-namespace" -Build -Push
```

### 方案三：GitHub Container Registry

#### 1. 创建 Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 创建 Token，勾选 `write:packages` 权限

#### 2. 登录并推送

```bash
# 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 标记并推送
docker tag microservices/user-service:latest ghcr.io/yourusername/user-service:latest
docker push ghcr.io/yourusername/user-service:latest
```

### 使用远程镜像部署

其他用户只需下载配置文件即可部署：

```bash
# 1. 下载配置文件
curl -O https://raw.githubusercontent.com/yourusername/repo/main/docker-compose.prod.yml
mkdir -p docker/mysql/init
curl -o docker/mysql/init/01-init-databases.sql https://raw.githubusercontent.com/yourusername/repo/main/docker/mysql/init/01-init-databases.sql

# 2. 设置镜像仓库地址
export REGISTRY=yourusername  # Docker Hub
# 或
export REGISTRY=registry.cn-hangzhou.aliyuncs.com/my-namespace  # 阿里云

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 版本管理

推送带版本号的镜像：

```powershell
# 推送指定版本
.\docker\scripts\publish.ps1 -Registry "yourusername" -Tag "v1.0.0" -Build -Push

# 同时推送 latest
.\docker\scripts\publish.ps1 -Registry "yourusername" -Tag "latest" -Push
```

使用指定版本：

```bash
export REGISTRY=yourusername
export TAG=v1.0.0
docker-compose -f docker-compose.prod.yml up -d
```

---

## GitHub Actions 自动化

项目已配置 GitHub Actions 工作流，实现代码推送后自动构建并发布 Docker 镜像。

### 工作流文件

位置：`.github/workflows/docker-publish.yml`

### 功能特性

- **自动触发**：推送到 `main` 分支或创建版本标签时自动执行
- **并行构建**：三个微服务并行构建，提高效率
- **多标签支持**：自动生成 `latest`、版本号、commit SHA 等标签
- **构建缓存**：使用 GitHub Actions 缓存加速构建
- **手动触发**：支持在 GitHub Actions 页面手动运行

### 配置步骤

#### 1. 创建 Docker Hub Access Token

1. 登录 [Docker Hub](https://hub.docker.com)
2. 点击头像 → **Account Settings** → **Security**
3. 点击 **New Access Token**
4. 输入描述（如 `github-actions`），选择 **Read & Write** 权限
5. **复制 Token**（只显示一次！）

#### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加：

| Secret 名称 | 值 |
|------------|---|
| `DOCKERHUB_USERNAME` | 你的 Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | 上一步创建的 Access Token |

#### 3. 触发工作流

**自动触发：**

```bash
# 修改 services 目录下的代码后推送
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

**创建版本发布：**

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

**手动触发：**

1. 进入 GitHub 仓库 → **Actions** 页签
2. 选择 **Build and Push Docker Images** 工作流
3. 点击 **Run workflow**
4. 可选：输入自定义标签
5. 点击 **Run workflow** 按钮

### 生成的镜像标签

| 触发方式 | 生成的标签示例 |
|---------|--------------|
| 推送到 main | `latest`, `main`, `abc1234` |
| 创建 v1.0.0 标签 | `1.0.0`, `1.0`, `latest` |
| 手动触发（输入 beta） | `beta` |

### 查看构建状态

1. 进入 GitHub 仓库 → **Actions** 页签
2. 可以看到所有工作流运行记录
3. 点击具体运行记录查看详细日志

### 工作流执行流程

```
1. 检出代码
    ↓
2. 设置 JDK 17 (Temurin)
    ↓
3. Maven 构建 JAR 包
    ↓
4. 设置 Docker Buildx
    ↓
5. 登录 Docker Hub
    ↓
6. 构建 Docker 镜像
    ↓
7. 推送到 Docker Hub
    ↓
8. 输出构建结果摘要
```

### 常见问题

**Q: 工作流执行失败怎么办？**

A: 查看 Actions 日志，常见原因：
- Secrets 未正确配置
- Docker Hub Token 过期
- Maven 构建失败

**Q: 如何修改镜像仓库地址？**

A: 编辑 `.github/workflows/docker-publish.yml`，修改 `IMAGE_PREFIX` 环境变量。

**Q: 如何添加新的微服务？**

A: 在工作流文件的 `matrix.service` 中添加新服务配置：

```yaml
strategy:
  matrix:
    service:
      - name: new-service
        context: ./services/new-service
```
