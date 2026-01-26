# 统一部署预览指南（前端 + 后端）

本文档说明如何为前端应用和 Java 微服务配置统一的部署预览，在合并 PR 之前预览完整的应用运行效果。

## 🎯 预览方案概览

### 国外主流方案对比

| 方案 | 类型 | 前端 | 后端 | 配置难度 | 费用 | 推荐度 |
|------|------|------|------|---------|------|--------|
| **Vercel** | 托管服务 | ✅ 自动 | ❌ 不支持 | ⭐ 简单 | 免费/付费 | ⭐⭐⭐⭐⭐ |
| **Netlify** | 托管服务 | ✅ 自动 | ❌ 不支持 | ⭐ 简单 | 免费/付费 | ⭐⭐⭐⭐ |
| **Render** | 托管服务 | ✅ 自动 | ✅ 自动 | ⭐⭐ 中等 | 免费/付费 | ⭐⭐⭐⭐⭐ |
| **Railway** | 托管服务 | ✅ 自动 | ✅ 自动 | ⭐⭐ 中等 | 免费/付费 | ⭐⭐⭐⭐ |
| **Fly.io** | 托管服务 | ✅ 自动 | ✅ 自动 | ⭐⭐ 中等 | 免费/付费 | ⭐⭐⭐⭐ |
| **PullPreview** | GitHub Action | ✅ 自动 | ✅ 自动 | ⭐⭐⭐ 中等 | $10+/月 | ⭐⭐⭐ |
| **Heroku** | 托管服务 | ✅ 自动 | ✅ 自动 | ⭐⭐ 中等 | 付费 | ⭐⭐⭐ |

### 本地/自托管方案

| 方案 | 前端预览 | 后端预览 | 配置难度 | 推荐度 |
|------|---------|---------|---------|--------|
| **Vercel + Docker 本地** | ✅ Vercel 自动部署 | ✅ Docker 本地 | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ |
| **Docker Compose 完整环境** | ✅ Docker 本地 | ✅ Docker 本地 | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ |
| **GitHub Actions + 云端** | ✅ 云端部署 | ✅ 云端部署 | ⭐⭐⭐⭐ 复杂 | ⭐⭐⭐ |

## 🚀 方案 1：Vercel（前端）+ Docker（后端）（推荐）

这是最实用的方案：前端使用 Vercel 自动部署预览，后端使用 Docker 本地预览。

### 前端：Vercel 自动部署

#### 配置步骤

1. **访问 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 **Add New Project**
   - 选择仓库 `gzhidao1011/react-demo-project`
   - 点击 **Import**

3. **配置项目设置**
   ```
   Framework Preset: React
   Root Directory: apps/web
   Build Command: pnpm install && pnpm --filter @repo/web build
   Output Directory: apps/web/dist
   Install Command: pnpm install
   ```

4. **启用预览评论**
   - 进入 **Settings** → **Git**
   - 启用 **Preview Comments**

#### 使用效果

- ✅ 每次创建 PR，Vercel 自动部署前端预览
- ✅ PR 评论中自动显示预览链接
- ✅ 每次推送新提交，预览自动更新

### 后端：Docker 本地预览

#### 操作步骤

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/full-stack-update

# 2. 构建 Java 服务
cd services
mvn clean package -DskipTests
cd ..

# 3. 启动后端服务
docker-compose up -d mysql nacos sentinel user-service order-service api-gateway

# 4. 等待服务启动（约 3-5 分钟）
docker-compose logs -f user-service

# 5. 测试后端 API
curl http://localhost:8080/api/users

# 6. 在 Vercel 预览中测试前后端集成
# 访问 Vercel 预览链接，测试前端调用后端 API

# 7. 清理
docker-compose down
```

#### 配置前端连接后端

在 Vercel 预览环境中，前端需要连接到本地后端：

**方法 1：使用 ngrok（推荐）**

```bash
# 安装 ngrok
# Windows: choco install ngrok
# Mac: brew install ngrok
# Linux: 下载并解压

# 创建隧道到本地 API Gateway
ngrok http 8080

# 复制 ngrok 提供的 URL（如：https://abc123.ngrok.io）
# 在 Vercel 环境变量中设置：
# VITE_API_BASE_URL=https://abc123.ngrok.io
```

**方法 2：修改前端 API 配置**

在 PR 分支中临时修改 API 基础 URL，指向本地后端：

```typescript
// apps/web/app/routes/core.ts 或类似文件
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

然后在 Vercel 环境变量中设置：
- `VITE_API_BASE_URL`: `http://your-ngrok-url.ngrok.io` 或 `http://your-public-ip:8080`

### 完整预览流程

1. **创建 PR**
   - Vercel 自动部署前端预览
   - 在 PR 评论中查看前端预览链接

2. **启动本地后端**
   ```bash
   git checkout feature/full-stack-update
   cd services && mvn clean package -DskipTests && cd ..
   docker-compose up -d mysql nacos user-service order-service api-gateway
   ```

3. **配置前端连接后端**
   - 使用 ngrok 创建隧道
   - 在 Vercel 环境变量中设置 API URL

4. **测试完整功能**
   - 访问 Vercel 预览链接
   - 测试前端调用后端 API
   - 验证完整业务流程

5. **清理环境**
   ```bash
   docker-compose down
   # ngrok 会自动关闭
   ```

## 🐳 方案 2：Docker Compose 完整环境（最简单）

使用 Docker Compose 同时启动前端和后端，适合需要完整环境预览的场景。

### 操作步骤

#### 步骤 1：Checkout PR 分支

```bash
git fetch origin
git checkout feature/full-stack-update
```

#### 步骤 2：构建所有服务

```bash
# 构建 Java 服务
cd services
mvn clean package -DskipTests
cd ..

# 前端会在 Docker 构建时自动构建
```

#### 步骤 3：启动完整环境

```bash
# 启动所有服务（前端 + 后端 + 基础设施）
docker-compose up -d

# 或使用生产配置
docker-compose -f docker-compose.prod.yml up -d
```

#### 步骤 4：等待服务启动

```bash
# 查看所有服务状态
docker-compose ps

# 查看前端服务日志
docker-compose logs -f web

# 查看后端服务日志
docker-compose logs -f user-service

# 等待看到服务启动成功的日志
```

**启动时间参考**：
- MySQL: 30-60 秒
- Nacos: 60-90 秒
- 后端服务: 30-60 秒（每个服务）
- 前端服务: 1-2 分钟
- **总计**: 约 5-10 分钟

#### 步骤 5：访问预览

根据项目配置，访问：

- **前端 Web 应用**: `http://web.example.com:8888`（需要配置 hosts）
- **前端 Docs 应用**: `http://docs.example.com:8888`
- **Storybook**: `http://storybook.example.com:8888`
- **API 网关**: `http://localhost:8080`
- **Nacos 控制台**: `http://localhost:8848/nacos`
- **Sentinel 控制台**: `http://localhost:8858`

**配置 hosts（Windows）**：

管理员权限编辑 `C:\Windows\System32\drivers\etc\hosts`：

```text
127.0.0.1 web.example.com
127.0.0.1 docs.example.com
127.0.0.1 storybook.example.com
```

#### 步骤 6：测试完整功能

```bash
# 1. 测试后端 API
curl http://localhost:8080/api/users
curl http://localhost:8080/api/orders

# 2. 在浏览器中访问前端
# http://web.example.com:8888

# 3. 测试前端调用后端 API
# 在前端页面中执行操作，验证前后端集成

# 4. 查看服务注册情况
# 访问 http://localhost:8848/nacos
```

#### 步骤 7：清理环境

```bash
# 停止所有服务
docker-compose down

# 完全清理（包括数据卷）
docker-compose down -v
```

### 优势

- ✅ **完整环境**：前端 + 后端 + 基础设施
- ✅ **真实部署**：与实际生产环境一致
- ✅ **无需额外配置**：使用现有 Docker Compose 配置
- ✅ **完全控制**：可以调试和修改

### 劣势

- ❌ **需要手动操作**：不能自动部署
- ❌ **资源消耗**：需要本地运行多个容器
- ❌ **启动时间较长**：完整环境需要 5-10 分钟

## 🌐 方案 3：Render（全栈应用预览，推荐）

Render 是国外流行的全栈应用部署平台，支持自动创建预览环境。

### 特点

- ✅ **自动预览**：PR 创建时自动部署
- ✅ **完整环境**：支持前端 + 后端 + 数据库
- ✅ **免费额度**：个人项目免费使用
- ✅ **简单配置**：通过 Web UI 或 render.yaml 配置
- ✅ **支持 Docker**：可以使用 Dockerfile 部署
- ✅ **支持 Monorepo**：通过 Root Directory 配置

### 快速开始

#### 方法 1：使用 render.yaml（推荐）

项目已包含 `render.yaml` 配置文件，可以一键创建所有服务：

1. **访问 Render**
   - 访问 [render.com](https://render.com)
   - 使用 GitHub 账号登录

2. **创建 Blueprint**
   - 点击 **New** → **Blueprint**
   - 连接 GitHub 仓库
   - Render 会自动读取 `render.yaml` 并创建所有服务

3. **等待部署完成**
   - 首次部署需要 10-15 分钟
   - 所有服务会自动创建和配置

4. **配置服务间通信**
   - 获取各服务的 URL（在 Dashboard 中查看）
   - 配置环境变量（见下面的详细说明）

#### 方法 2：手动创建服务

如果不想使用 Blueprint，可以手动创建每个服务：

**前端服务（Static Site）**：

1. 点击 **New** → **Static Site**
2. 连接 GitHub 仓库
3. 配置：
   - **Name**: `web`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm --filter @repo/web build`
   - **Publish Directory**: `apps/web/build/client`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: `https://api-gateway-xxx.onrender.com`
     - `NODE_VERSION`: `22`
     - `PNPM_VERSION`: `10.28.0`

**后端服务（Web Service）**：

1. 点击 **New** → **Web Service**
2. 连接 GitHub 仓库
3. 配置：
   - **Name**: `api-gateway`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `services/api-gateway/Dockerfile`
   - **Docker Context**: `services/api-gateway`
   - **Build Command**: `cd ../.. && mvn clean package -DskipTests -pl api-gateway -am`

**数据库服务**：

1. 点击 **New** → **PostgreSQL**
2. 配置数据库名称和版本
3. Render 会自动创建数据库

### 详细配置

**完整配置指南**：请参考 [Render 完整部署预览指南](./RENDER_DEPLOY_PREVIEW_GUIDE.md)

### 使用效果

- ✅ 每个 PR 自动创建独立的预览环境
- ✅ 前端和后端都有独立的预览 URL
- ✅ PR 评论中自动显示预览链接
- ✅ PR 合并后自动清理预览环境
- ✅ 支持完整的微服务架构预览

### 费用

- **免费计划**：有限制的预览环境
- **付费计划**：$7+/月，支持更多预览环境

## 🚂 方案 4：Railway（全栈应用预览）

Railway 是另一个流行的全栈应用部署平台。

### 特点

- ✅ **自动预览**：PR 创建时自动部署
- ✅ **支持 Docker**：可以使用 Docker Compose
- ✅ **简单配置**：通过 Web UI 配置
- ✅ **免费额度**：每月 $5 免费额度

### 配置步骤

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 创建新项目，选择 **Deploy from GitHub repo**
4. 选择仓库并配置服务
5. Railway 会自动为 PR 创建预览环境

## ✈️ 方案 5：Fly.io（容器化应用预览）

Fly.io 专注于容器化应用的部署。

### 特点

- ✅ **全球部署**：边缘计算，低延迟
- ✅ **支持 Docker**：原生 Docker 支持
- ✅ **自动预览**：PR 创建时自动部署
- ✅ **免费额度**：每月免费额度

### 配置步骤

1. 安装 Fly CLI：`curl -L https://fly.io/install.sh | sh`
2. 登录：`fly auth login`
3. 初始化项目：`fly launch`
4. 配置 `fly.toml`
5. 部署：`fly deploy`

## 🔧 方案 6：GitHub Actions + 云端部署（高级）

如果需要完全自定义的云端预览，可以配置 GitHub Actions 自动部署到临时环境。

### 配置步骤

#### 步骤 1：创建预览工作流

创建 `.github/workflows/full-stack-preview.yml`：

```yaml
name: Full Stack Preview

on:
  pull_request:
    branches:
      - main
    paths:
      - 'apps/**'
      - 'services/**'
      - 'packages/**'

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 构建前端
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.28.0
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build frontend
        run: pnpm --filter @repo/web build
      
      # 构建后端
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      
      - name: Build Java services
        working-directory: ./services
        run: mvn clean package -DskipTests
      
      # 部署到预览环境
      - name: Deploy to preview
        # 这里需要配置实际的部署步骤
        # 例如：推送到 Docker Hub，然后在临时服务器上拉取并运行
        run: |
          echo "部署到预览环境..."
          # 实际部署命令
      
      # 评论 PR
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 预览环境已部署：\n- 前端: https://preview-xxx.example.com\n- 后端 API: https://api-preview-xxx.example.com'
            })
```

**注意**：这个方案需要：
- 临时服务器或云服务资源
- Docker Hub 或其他镜像仓库
- SSH 密钥配置
- 网络访问配置

### 优势

- ✅ 可以在任何地方访问预览
- ✅ 不占用本地资源
- ✅ 可以分享给团队成员
- ✅ 自动部署

### 劣势

- ❌ 配置复杂
- ❌ 需要服务器资源
- ❌ 成本较高

## 📋 预览检查清单

### 前端检查

- [ ] 前端页面正常加载
- [ ] 样式正确显示
- [ ] 路由正常工作
- [ ] 前端调用后端 API 正常
- [ ] 错误处理正常

### 后端检查

- [ ] 服务容器正常运行
- [ ] 服务日志无错误
- [ ] 健康检查通过
- [ ] 服务已注册到 Nacos
- [ ] API 接口正常响应
- [ ] 数据库连接正常

### 集成检查

- [ ] 前端可以调用后端 API
- [ ] 数据正确传递
- [ ] 错误处理正常
- [ ] 完整业务流程正常

## 🎯 实际示例

### 示例 1：预览用户登录功能

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/user-login

# 2. 构建后端
cd services
mvn clean package -DskipTests -pl user-service -am
cd ..

# 3. 启动环境
docker-compose up -d mysql nacos user-service api-gateway web

# 4. 等待启动（约 5 分钟）
sleep 300

# 5. 测试
# - 访问前端: http://web.example.com:8888
# - 测试登录功能
# - 验证前后端集成

# 6. 清理
docker-compose down
```

### 示例 2：预览订单创建功能

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/order-creation

# 2. 构建所有相关服务
cd services
mvn clean package -DskipTests -pl order-service,user-service -am
cd ..

# 3. 启动完整环境
docker-compose up -d

# 4. 等待启动
sleep 300

# 5. 测试
# - 访问前端: http://web.example.com:8888
# - 创建订单
# - 验证订单服务调用用户服务

# 6. 清理
docker-compose down
```

## 💡 最佳实践

### 1. 选择合适的方案

- **快速预览前端**：使用 Vercel
- **完整环境预览**：使用 Docker Compose
- **云端预览**：使用 GitHub Actions（需要配置）

### 2. 优化预览速度

- **只构建修改的服务**：使用 `-pl service-name -am`
- **只启动需要的服务**：不启动不需要的服务
- **使用缓存**：Docker 镜像缓存、Maven 缓存等

### 3. 及时清理

- **预览完成后清理**：释放资源
- **定期清理镜像**：删除不需要的 Docker 镜像
- **清理数据卷**：如果不需要保留数据

### 4. 记录预览结果

在 PR 评论中记录：
- ✅ 预览了哪些功能
- ✅ 测试了哪些场景
- ✅ 发现了哪些问题（如果有）

## 🔍 故障排除

### 问题 1：前端无法连接后端

**检查**：
- 后端服务是否正常运行
- API Gateway 是否可访问
- 网络连接是否正常

**解决方案**：
- 检查后端服务状态：`docker-compose ps`
- 测试后端 API：`curl http://localhost:8080/api/users`
- 检查前端 API 配置

### 问题 2：服务启动失败

**检查**：
```bash
# 查看服务日志
docker-compose logs [service-name]

# 检查容器状态
docker-compose ps

# 检查端口占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080  # Mac/Linux
```

**解决方案**：
- 检查端口是否被占用
- 检查数据库连接配置
- 检查 Nacos 连接配置
- 查看服务日志找到具体错误

### 问题 3：Vercel 预览无法连接本地后端

**解决方案**：
- 使用 ngrok 创建隧道
- 在 Vercel 环境变量中设置 API URL
- 或使用 Docker Compose 完整环境方案

## 🌍 国外主流方案详细对比

### Vercel（前端首选）

**优势**：
- ✅ 配置最简单
- ✅ 自动部署预览
- ✅ PR 集成完善
- ✅ 免费额度充足
- ✅ 全球 CDN

**劣势**：
- ❌ 不支持后端服务
- ❌ 需要配合其他方案预览后端

**适用场景**：React/Vue/Next.js 前端应用

**官网**：https://vercel.com

### Netlify（前端备选）

**优势**：
- ✅ 配置简单
- ✅ 自动部署预览
- ✅ 支持 Serverless Functions
- ✅ 免费额度充足

**劣势**：
- ❌ 后端支持有限
- ❌ 不适合复杂后端应用

**适用场景**：静态网站、JAMstack 应用

**官网**：https://www.netlify.com

### Render（全栈推荐）

**优势**：
- ✅ 支持前端 + 后端
- ✅ 自动预览环境
- ✅ 支持 Docker
- ✅ 免费额度可用

**劣势**：
- ⚠️ 免费额度有限
- ⚠️ 配置稍复杂

**适用场景**：全栈应用、微服务架构

**官网**：https://render.com

### Railway（全栈备选）

**优势**：
- ✅ 支持 Docker Compose
- ✅ 自动预览环境
- ✅ 配置简单
- ✅ 免费额度可用

**劣势**：
- ⚠️ 免费额度有限
- ⚠️ 功能相对简单

**适用场景**：全栈应用、Docker 应用

**官网**：https://railway.app

### Fly.io（容器化应用）

**优势**：
- ✅ 全球边缘部署
- ✅ 低延迟
- ✅ 支持 Docker
- ✅ 自动预览

**劣势**：
- ⚠️ 配置较复杂
- ⚠️ 学习曲线陡

**适用场景**：需要全球部署的应用

**官网**：https://fly.io

### PullPreview（自托管）

**优势**：
- ✅ 代码完全私有
- ✅ 成本可控
- ✅ 完全控制

**劣势**：
- ❌ 需要 AWS 账号
- ❌ 配置复杂
- ❌ 需要维护

**适用场景**：企业级应用、需要完全控制

**官网**：https://github.com/khulnasoft/pullpreview

## 💡 方案选择建议

### 场景 1：只需要预览前端

**推荐**：**Vercel** 或 **Netlify**
- 配置最简单
- 自动部署预览
- 免费使用

### 场景 2：需要预览前端 + 后端

**推荐**：
1. **Render**（最简单，推荐）
2. **Railway**（备选）
3. **Vercel + Docker 本地**（最实用）

### 场景 3：需要完整微服务环境

**推荐**：
1. **Docker Compose 本地**（最简单）
2. **Render**（如果支持 Docker Compose）
3. **GitHub Actions + 临时服务器**（完全自定义）

### 场景 4：企业级需求

**推荐**：
1. **PullPreview**（自托管，完全控制）
2. **GitHub Actions + 云服务**（完全自定义）
3. **Render/Railway 付费计划**（托管服务）

## 📚 相关文档

- [Render 完整部署预览指南](./RENDER_DEPLOY_PREVIEW_GUIDE.md) - Render 平台详细配置指南 ⭐
- [前端部署预览指南](./DEPLOY_PREVIEW_GUIDE.md) - 前端专用预览指南
- [Java 微服务部署预览指南](./JAVA_DEPLOY_PREVIEW_GUIDE.md) - 后端专用预览指南
- [Docker Compose 配置](../docker-compose.yml)
- [Render 官方文档](https://docs.render.com)
- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://docs.render.com)
- [Railway 文档](https://docs.railway.app)
- [Fly.io 文档](https://fly.io/docs)

## ❓ 常见问题

### Q: 哪种方案最好？

**A**: 
- **Vercel + Docker 本地**：最实用，前端自动部署，后端本地预览
- **Docker Compose 完整环境**：最简单，一键启动所有服务
- **GitHub Actions 云端**：最灵活，但配置复杂

### Q: 预览需要多长时间？

**A**: 
- **Vercel 前端**：2-5 分钟（自动）
- **Docker 后端**：3-5 分钟（手动）
- **Docker Compose 完整环境**：5-10 分钟（手动）

### Q: 可以同时预览多个 PR 吗？

**A**: 
- **Vercel**：可以，每个 PR 有独立预览
- **Docker 本地**：可以，但需要使用不同端口或不同 Docker Compose 文件

### Q: 预览环境会影响本地开发吗？

**A**: 
- 如果使用相同端口，会有冲突
- 建议使用不同的端口或不同的 Docker Compose 文件
- 预览完成后及时清理

### Q: 如何加快预览速度？

**A**: 
- 只构建修改的服务
- 只启动需要的服务
- 使用 Docker 镜像缓存
- 跳过测试（`-DskipTests`）
