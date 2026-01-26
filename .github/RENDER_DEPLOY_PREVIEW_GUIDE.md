# Render 完整部署预览指南

本文档提供基于 Render 平台的完整部署预览方案，支持前端应用和 Java 微服务的统一预览。

## 📋 目录

- [方案概述](#方案概述)
- [架构设计](#架构设计)
- [前置要求](#前置要求)
- [配置步骤](#配置步骤)
- [PR 预览配置](#pr-预览配置)
- [环境变量配置](#环境变量配置)
- [服务间通信](#服务间通信)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 🎯 方案概述

### Render 平台特点

- ✅ **自动部署预览**：PR 创建时自动部署
- ✅ **支持 Docker**：可以使用 Dockerfile 部署
- ✅ **支持 Monorepo**：通过 Root Directory 配置
- ✅ **免费额度**：个人项目免费使用
- ✅ **数据库支持**：支持 MySQL（Docker 部署）

### 项目适配说明

由于 Render 平台的特点，需要进行以下适配：

1. **数据库**：使用 MySQL（Docker 部署，需要配置 Render Disk）
2. **服务发现**：Nacos 使用 MySQL 数据库
3. **端口配置**：Render 使用 `PORT` 环境变量
4. **服务通信**：使用 Render 内部 DNS（`service-name.onrender.com`）

### MySQL 配置说明

**配置要求**：
- ✅ 使用 Docker 部署 MySQL
- ✅ 需要配置 Render Disk（持久化存储）
- ✅ Mount Path: `/var/lib/mysql`（必须）
- ✅ Size: `10 GB`（根据需求调整）

**注意事项**：
- ⚠️ 没有配置 Render Disk，数据不会持久化
- ⚠️ 需要在 Dashboard 中手动配置 Render Disk
- ⚠️ MySQL 密码由 Render 自动生成，需要在 Dashboard 中查看

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Render Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Static Site │  │  Static Site │  │  Static Site │ │
│  │   (web)      │  │   (docs)     │  │ (storybook)  │ │
│  └──────┬───────┘  └──────────────┘  └──────────────┘ │
│         │                                              │
│         │  /api/* → https://api-gateway.onrender.com  │
│         ▼                                              │
│  ┌──────────────┐                                      │
│  │ Web Service  │                                      │
│  │ API Gateway  │                                      │
│  └──────┬───────┘                                      │
│         │                                              │
│         ├──────────────┬──────────────┐               │
│         ▼              ▼              ▼               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Web    │  │   Web    │  │   Web    │           │
│  │ Service  │  │ Service  │  │ Service  │           │
│  │  User    │  │  Order   │  │  Nacos   │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │                 │
│       └──────┬───────┴──────┬───────┘                 │
│              ▼              ▼                         │
│       ┌──────────┐  ┌──────────┐                     │
│       │ Database │  │ Database │                     │
│       │  MySQL   │  │  MySQL   │                     │
│       └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## ✅ 前置要求

### 1. Render 账号

- 访问 [render.com](https://render.com)
- 使用 GitHub 账号登录
- 授权 Render 访问您的仓库

### 2. 项目配置

确保项目已包含以下文件：
- ✅ `render.yaml` - Render Blueprint 配置
- ✅ `application-render.yml` - Render 环境配置
- ✅ `docker/nacos/Dockerfile` - Nacos Dockerfile
- ✅ MySQL 驱动依赖（已在 pom.xml 中添加）

## 📝 配置步骤

### 步骤 1：配置 MySQL 数据库（重要）

**重要**：MySQL 需要配置 Render Disk，否则数据不会持久化。

**配置步骤**：

1. **创建 MySQL 服务**：
   - `render.yaml` 中已配置 MySQL 服务（`user-db`、`order-db`、`nacos-db`）
   - 使用 Docker 部署 MySQL

2. **配置 Render Disk**（必须在 Dashboard 中手动配置）：
   - 进入每个 MySQL 服务的 Dashboard
   - 点击 "Settings" → "Disks"
   - 添加 Render Disk：
     - **Mount Path**: `/var/lib/mysql`（必须，不能更改）
     - **Size**: `10 GB`（根据需求调整）
   - 为以下服务配置 Disk：
     - `user-db`
     - `order-db`
     - `nacos-db`

3. **配置 MySQL 密码**（重要）：
   - MySQL 密码由 Render 自动生成（在 MySQL 服务中）
   - **步骤**：
     1. 进入每个 MySQL 服务的 Dashboard（`user-db`、`order-db`、`nacos-db`）
     2. 查看环境变量 `MYSQL_PASSWORD` 的值（Render 自动生成）
     3. 复制密码值
     4. 在需要连接该数据库的服务中配置密码：
        - `user-service` → 使用 `user-db` 的密码
        - `order-service` → 使用 `order-db` 的密码
        - `nacos` → 使用 `nacos-db` 的密码
   - **注意**：`render.yaml` 中使用了占位符 `CHANGE_ME_IN_DASHBOARD`，需要在 Dashboard 中替换为实际密码

### 步骤 2：创建 Render Blueprint

1. **访问 Render Dashboard**
   - 登录 [render.com](https://render.com)
   - 点击 **New** → **Blueprint**

2. **连接 GitHub 仓库**
   - 选择 **Connect GitHub**
   - 授权 Render 访问您的仓库
   - 选择仓库：`gzhidao1011/react-demo-project`

3. **创建 Blueprint**
   - Render 会自动读取 `render.yaml` 文件
   - 点击 **Apply** 创建所有服务

4. **等待服务创建**
   - Render 会自动创建所有定义的服务
   - 首次部署可能需要 10-15 分钟

### 步骤 2：配置服务设置

#### 前端服务配置

**Web 应用（Static Site）**：

1. 进入 `web` 服务设置
2. **Build & Deploy**：
   - **Root Directory**: `apps/web`（如果支持）
   - **Build Command**: `pnpm install && pnpm --filter @repo/web build`
   - **Publish Directory**: `apps/web/build/client`

3. **Environment Variables**：
   - `VITE_API_BASE_URL`: `https://api-gateway.onrender.com`
   - `NODE_VERSION`: `22`
   - `PNPM_VERSION`: `10.28.0`

**Docs 应用**：

1. **Root Directory**: `apps/docs`
2. **Build Command**: `pnpm install && pnpm --filter @repo/docs build`
3. **Publish Directory**: `apps/docs/build/client`

**Storybook**：

1. **Root Directory**: `apps/storybook`
2. **Build Command**: `pnpm install && pnpm --filter @repo/storybook build-storybook`
3. **Publish Directory**: `apps/storybook/storybook-static`

#### 后端服务配置

**Nacos 服务**：

1. **Environment**: `Docker`
2. **Dockerfile Path**: `./docker/nacos/Dockerfile`
3. **Docker Context**: `./docker/nacos`
4. **Environment Variables**（已在 render.yaml 中配置）：
   - `MODE`: `standalone`
   - `SPRING_DATASOURCE_PLATFORM`: `mysql`
   - 数据库连接信息（自动从 nacos-db 获取）

**用户服务**：

1. **Environment**: `Docker`
2. **Dockerfile Path**: `./services/user-service/Dockerfile`
3. **Docker Context**: `./services/user-service`
4. **Build Command**: `cd ../.. && mvn clean package -DskipTests -pl user-service -am`
5. **Environment Variables**：
   - `SPRING_PROFILES_ACTIVE`: `render`
   - `PORT`: `8001`
   - `NACOS_SERVER_ADDR`: `nacos.onrender.com:8848`（需要手动配置）
   - 数据库连接信息（自动从 user-db 获取）

**订单服务**：

1. **Environment**: `Docker`
2. **Dockerfile Path**: `./services/order-service/Dockerfile`
3. **Docker Context**: `./services/order-service`
4. **Build Command**: `cd ../.. && mvn clean package -DskipTests -pl order-service -am`
5. **Environment Variables**：
   - `SPRING_PROFILES_ACTIVE`: `render`
   - `PORT`: `8002`
   - `NACOS_SERVER_ADDR`: `nacos.onrender.com:8848`（需要手动配置）
   - 数据库连接信息（自动从 order-db 获取）

**API 网关**：

1. **Environment**: `Docker`
2. **Dockerfile Path**: `./services/api-gateway/Dockerfile`
3. **Docker Context**: `./services/api-gateway`
4. **Build Command**: `cd ../.. && mvn clean package -DskipTests -pl api-gateway -am`
5. **Environment Variables**：
   - `SPRING_PROFILES_ACTIVE`: `render`
   - `PORT`: `8080`
   - `NACOS_SERVER_ADDR`: `nacos.onrender.com:8848`（需要手动配置）

### 步骤 3：配置服务间通信

Render 服务间通信使用内部 DNS，格式为：`service-name.onrender.com`

**重要**：需要在 Dashboard 中手动配置以下环境变量：

1. **获取服务 URL**：
   - 进入每个服务的 Dashboard
   - 复制服务的 URL（例如：`https://nacos-xxx.onrender.com`）
   - 提取主机名（例如：`nacos-xxx.onrender.com`）

2. **配置 NACOS_SERVER_ADDR**：
   - 在 `user-service`、`order-service`、`api-gateway` 中设置：
   - `NACOS_SERVER_ADDR`: `nacos-xxx.onrender.com:8848`
   - 注意：需要替换为实际的 Nacos 服务 URL

3. **配置前端 API URL**：
   - 在 `web` 服务中设置：
   - `VITE_API_BASE_URL`: `https://api-gateway-xxx.onrender.com`
   - 注意：需要替换为实际的 API Gateway URL

## 🚀 PR 预览配置

### 启用自动预览

1. **进入服务设置**
   - 在 Render Dashboard 中选择服务
   - 进入 **Settings** → **Previews**

2. **选择预览模式**
   - **Automatic**：所有 PR 自动创建预览（推荐）
   - **Manual**：需要添加 `render-preview` 标签或 `[render preview]` 在 PR 标题中

3. **配置预览设置**
   - **Preview URL Pattern**：使用默认格式
   - **Auto-deploy**：启用自动部署

### 预览效果

配置完成后：

- ✅ 每次创建 PR，Render 自动部署预览环境
- ✅ 每个服务都有独立的预览 URL
- ✅ PR 评论中自动显示预览链接
- ✅ 每次推送新提交，预览自动更新
- ✅ PR 合并或关闭后，预览自动删除

### 查看预览

1. **在 PR 评论中**：
   - Render bot 会自动评论预览链接
   - 格式：`Preview: https://service-name-pr-xxx.onrender.com`

2. **在 Render Dashboard**：
   - 进入服务页面
   - 查看 **Previews** 标签
   - 找到对应的 PR 预览

## 🔧 环境变量配置

### 必需的环境变量

#### 前端服务（web）

```bash
VITE_API_BASE_URL=https://api-gateway-xxx.onrender.com
NODE_VERSION=22
PNPM_VERSION=10.28.0
```

#### 后端服务（user-service, order-service）

```bash
SPRING_PROFILES_ACTIVE=render
PORT=8001  # 或 8002
NACOS_SERVER_ADDR=nacos-xxx.onrender.com:8848
MYSQL_HOST=<自动从数据库获取>
MYSQL_PORT=<自动从数据库获取>
MYSQL_DATABASE=<自动从数据库获取>
MYSQL_USERNAME=<自动从数据库获取>
MYSQL_PASSWORD=<自动从数据库获取>
DOCKER_HOST_IP=user-service-xxx.onrender.com
```

#### API Gateway

```bash
SPRING_PROFILES_ACTIVE=render
PORT=8080
NACOS_SERVER_ADDR=nacos-xxx.onrender.com:8848
```

### 环境变量配置方法

**方法 1：通过 Dashboard（推荐）**

1. 进入服务设置
2. 点击 **Environment** 标签
3. 添加或编辑环境变量
4. 点击 **Save Changes**

**方法 2：通过 render.yaml**

在 `render.yaml` 中定义环境变量，Render 会自动应用。

**注意**：某些环境变量（如服务 URL）需要在 Dashboard 中手动配置，因为 render.yaml 无法动态获取服务 URL。

## 🌐 服务间通信

### Render 内部 DNS

Render 服务间通信使用内部 DNS：

- **格式**：`service-name.onrender.com`
- **示例**：`nacos-abc123.onrender.com`
- **端口**：需要手动指定（如 `:8848`）

### 配置示例

**用户服务连接 Nacos**：

```yaml
NACOS_SERVER_ADDR: nacos-abc123.onrender.com:8848
```

**前端连接 API Gateway**：

```yaml
VITE_API_BASE_URL: https://api-gateway-xyz789.onrender.com
```

**API Gateway 路由配置**：

API Gateway 通过 Nacos 服务发现自动路由到后端服务，无需手动配置服务 URL。

## 🔍 故障排除

### 问题 1：服务启动失败

**症状**：服务部署失败，日志显示错误

**可能原因**：
- 构建命令错误
- 依赖安装失败
- 环境变量配置错误

**解决方案**：
1. 查看服务日志：进入服务 Dashboard → **Logs**
2. 检查构建命令是否正确
3. 检查环境变量是否配置完整
4. 确认数据库连接信息正确

### 问题 2：服务无法连接到 Nacos

**症状**：服务启动成功，但无法注册到 Nacos

**可能原因**：
- `NACOS_SERVER_ADDR` 配置错误
- Nacos 服务未启动
- 网络连接问题

**解决方案**：
1. 检查 `NACOS_SERVER_ADDR` 是否正确
2. 确认 Nacos 服务已启动（查看 Nacos Dashboard）
3. 访问 Nacos 控制台：`https://nacos-xxx.onrender.com/nacos`
4. 检查服务注册情况

### 问题 3：数据库连接失败

**症状**：服务无法连接到数据库

**可能原因**：
- 数据库连接 URL 错误
- 用户名或密码错误
- 数据库未创建

**解决方案**：
1. 检查数据库连接信息（在 Dashboard 中查看）
2. 确认数据库已创建
3. 检查 `application-render.yml` 中的数据库配置
4. 确认使用 MySQL 驱动

### 问题 4：前端无法调用后端 API

**症状**：前端页面正常，但 API 调用失败

**可能原因**：
- `VITE_API_BASE_URL` 配置错误
- API Gateway 未启动
- CORS 配置问题

**解决方案**：
1. 检查 `VITE_API_BASE_URL` 是否正确
2. 确认 API Gateway 服务已启动
3. 测试 API Gateway 健康检查：`https://api-gateway-xxx.onrender.com/actuator/health`
4. 检查浏览器控制台的错误信息

### 问题 5：构建时间过长

**症状**：构建超过 15 分钟仍未完成

**可能原因**：
- Monorepo 构建需要安装所有依赖
- Maven 构建需要下载依赖
- 构建命令未优化

**解决方案**：
1. 优化构建命令：只构建需要的服务
2. 使用缓存：Render 会自动缓存依赖
3. 考虑拆分服务：将大型服务拆分为多个小服务

## 💡 最佳实践

### 1. 服务配置

- ✅ **使用 render.yaml**：统一管理所有服务配置
- ✅ **环境变量分离**：不同环境使用不同的配置文件
- ✅ **服务命名规范**：使用清晰的命名（如 `user-service`、`api-gateway`）

### 2. 构建优化

- ✅ **只构建需要的服务**：使用 `-pl service-name -am`
- ✅ **跳过测试**：预览环境使用 `-DskipTests`
- ✅ **使用缓存**：Render 会自动缓存依赖

### 3. 预览管理

- ✅ **启用自动预览**：所有 PR 自动创建预览
- ✅ **及时清理**：PR 关闭后预览自动删除
- ✅ **记录预览结果**：在 PR 评论中记录测试结果

### 4. 监控和调试

- ✅ **查看日志**：定期查看服务日志
- ✅ **健康检查**：使用 Actuator 健康检查端点
- ✅ **服务注册**：定期检查 Nacos 服务注册情况

## 📊 服务 URL 格式

### 生产环境

- **Web**: `https://web-xxx.onrender.com`
- **Docs**: `https://docs-xxx.onrender.com`
- **Storybook**: `https://storybook-xxx.onrender.com`
- **API Gateway**: `https://api-gateway-xxx.onrender.com`
- **User Service**: `https://user-service-xxx.onrender.com`
- **Order Service**: `https://order-service-xxx.onrender.com`
- **Nacos**: `https://nacos-xxx.onrender.com/nacos`

### PR 预览环境

- **Web**: `https://web-pr-123-xxx.onrender.com`
- **API Gateway**: `https://api-gateway-pr-123-xxx.onrender.com`
- 其他服务类似

## 🔄 部署流程

### 首次部署

1. **创建 Blueprint**
   - 连接 GitHub 仓库
   - Render 读取 `render.yaml`
   - 创建所有服务

2. **等待部署完成**
   - 数据库服务：约 2-3 分钟
   - Nacos 服务：约 3-5 分钟
   - Java 服务：约 5-10 分钟（每个服务）
   - 前端服务：约 3-5 分钟（每个服务）

3. **配置服务间通信**
   - 获取各服务的 URL
   - 配置环境变量
   - 重启服务使配置生效

4. **验证部署**
   - 访问前端应用
   - 测试 API 调用
   - 检查服务注册情况

### PR 预览部署

1. **创建 PR**
   - 在 GitHub 上创建 PR
   - Render 自动检测 PR 创建

2. **自动部署**
   - Render 为每个服务创建预览环境
   - 使用 PR 分支的代码
   - 部署到独立的预览 URL

3. **查看预览**
   - 在 PR 评论中查看预览链接
   - 或在 Render Dashboard 中查看

4. **测试预览**
   - 访问预览 URL
   - 测试功能是否正常
   - 记录测试结果

5. **自动清理**
   - PR 合并或关闭后
   - Render 自动删除预览环境

## 📚 相关文档

- [Render 官方文档](https://docs.render.com)
- [Render Monorepo 支持](https://docs.render.com/monorepo-support)
- [Render Service Previews](https://docs.render.com/service-previews)
- [统一部署预览指南](./UNIFIED_DEPLOY_PREVIEW_GUIDE.md)
- [Java 微服务部署预览指南](./JAVA_DEPLOY_PREVIEW_GUIDE.md)

## 🔄 MySQL 配置说明

项目使用 MySQL 数据库，配置说明如下：

1. **MySQL 部署**：
   - 使用 Docker 部署 MySQL（`docker/mysql/Dockerfile`）
   - 在 `render.yaml` 中配置 MySQL 服务

2. **Render Disk 配置**（重要）：
   - 必须在 Dashboard 中为每个 MySQL 服务添加 Render Disk
   - Mount Path: `/var/lib/mysql`（必须）
   - Size: `10 GB`（根据需求调整）
   - 没有配置 Render Disk，数据不会持久化

3. **数据库配置**：
   - 使用 `application-render.yml`（已配置 MySQL）
   - 确保 `SPRING_PROFILES_ACTIVE=render`

4. **MySQL 驱动**：
   - 已在 `pom.xml` 中添加 MySQL 驱动依赖

## ❓ 常见问题

### Q: Render 支持 MySQL 吗？

**A**: 
- ✅ **支持**，需要通过 Docker 部署（不是托管服务）
- ✅ MySQL 需要配置 Render Disk 进行持久化存储
- ✅ 项目已配置 MySQL，直接使用即可

### Q: MySQL 需要配置 Render Disk 吗？

**A**: 
- ✅ **必须配置**，否则数据不会持久化
- ✅ Mount Path: `/var/lib/mysql`（必须）
- ✅ Size: `10 GB`（根据需求调整）
- ✅ 在 Dashboard 中为每个 MySQL 服务添加 Disk

### Q: Render 免费计划有什么限制？

**A**: 
- 免费计划有资源限制（CPU、内存、带宽）
- 服务在 15 分钟无活动后会自动休眠
- 预览环境数量有限制
- 建议：小型项目可以使用免费计划，大型项目考虑付费计划

### Q: 如何加快部署速度？

**A**: 
- 优化构建命令（只构建需要的服务）
- 使用 Render 的缓存功能
- 减少依赖数量
- 使用更小的 Docker 镜像

### Q: 服务休眠后如何唤醒？

**A**: 
- 访问服务 URL 会自动唤醒
- 或手动在 Dashboard 中重启服务
- 预览环境会自动唤醒

### Q: 可以同时预览多个 PR 吗？

**A**: 
- ✅ 可以
- 每个 PR 都有独立的预览环境
- 不会相互影响

### Q: 如何调试服务问题？

**A**: 
- 查看服务日志（Dashboard → Logs）
- 使用健康检查端点（`/actuator/health`）
- 检查 Nacos 控制台（服务注册情况）
- 查看 Render 的构建日志

### Q: 数据库数据会保留吗？

**A**: 
- **MySQL（Docker 部署）**：
  - ✅ 如果配置了 Render Disk，数据会保留
  - ⚠️ 如果没有配置 Render Disk，数据不会持久化（重启后丢失）
  - ✅ PR 预览环境数据是临时的，PR 关闭后删除
  - ⚠️ **重要**：必须在 Dashboard 中配置 Render Disk

## 🎯 快速开始检查清单

- [ ] Render 账号已创建并登录
- [ ] GitHub 仓库已连接到 Render
- [ ] `render.yaml` 文件已创建
- [ ] `application-render.yml` 配置文件已创建
- [ ] MySQL 驱动依赖已添加
- [ ] MySQL Render Disk 已配置（重要）
- [ ] Blueprint 已创建
- [ ] 所有服务已部署成功
- [ ] 服务间通信已配置
- [ ] PR 预览已启用
- [ ] 测试 PR 已创建并验证

## 💰 费用说明

### 免费计划

- ✅ 个人项目免费使用
- ✅ 有限制的资源（CPU、内存）
- ✅ 服务会在无活动时休眠
- ✅ 预览环境数量有限制

### 付费计划

- **Starter**: $7/月/服务
- **Standard**: $25/月/服务
- **Pro**: $85/月/服务

**建议**：
- 小型项目：使用免费计划
- 中型项目：考虑 Starter 计划
- 大型项目：使用 Standard 或 Pro 计划
