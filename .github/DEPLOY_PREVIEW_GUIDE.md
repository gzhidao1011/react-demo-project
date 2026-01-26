# 前端部署预览指南

> **📌 提示**：如果您需要预览**前端 + 后端**的完整环境，请参考 [统一部署预览指南](./UNIFIED_DEPLOY_PREVIEW_GUIDE.md)。

本文档说明如何配置和使用前端应用的部署预览功能，在合并 PR 之前预览实际部署效果。

## 🎯 什么是部署预览？

部署预览（Deploy Preview）是在 PR 创建时，自动将 PR 分支的代码部署到一个临时的预览环境，让您可以在浏览器中查看实际运行效果，而不仅仅是代码差异。

## 📋 部署预览方案对比

| 方案 | 适用场景 | 配置难度 | 费用 | 推荐度 |
|------|---------|---------|------|--------|
| **Vercel** | React/Vue/Next.js 前端应用 | ⭐ 简单 | 免费 | ⭐⭐⭐⭐⭐ |
| **Netlify** | 静态网站/前端应用 | ⭐ 简单 | 免费 | ⭐⭐⭐⭐ |
| **GitHub Pages** | 静态网站 | ⭐⭐ 中等 | 免费 | ⭐⭐⭐ |
| **Docker + 本地预览** | 全栈应用 | ⭐⭐⭐ 复杂 | 免费 | ⭐⭐⭐⭐ |
| **GitHub Actions + 临时环境** | 自定义部署 | ⭐⭐⭐⭐ 很复杂 | 免费 | ⭐⭐ |

## 🚀 方案 1：使用 Vercel（推荐，最简单）

Vercel 是最简单且功能强大的部署预览方案，特别适合 React/Vue/Next.js 项目。

### 配置步骤

#### 步骤 1：安装 Vercel CLI（可选）

```bash
npm i -g vercel
```

#### 步骤 2：连接 GitHub 仓库

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 **Add New Project**
4. 选择您的 GitHub 仓库
5. 点击 **Import**

#### 步骤 3：配置项目设置

在 Vercel 项目设置中：

**Framework Preset**: 选择您的框架（React、Vue、Next.js 等）

**Root Directory**: 
- 如果是 monorepo，设置为 `apps/web` 或 `apps/docs`
- 如果是单仓库，留空

**Build Command**: 
```bash
cd apps/web && pnpm build
# 或
pnpm --filter @repo/web build
```

**Output Directory**: 
```
apps/web/dist
# 或根据实际构建输出目录调整
```

**Install Command**: 
```bash
pnpm install
```

#### 步骤 4：环境变量（如果需要）

在 Vercel 项目设置中添加环境变量：
- `NODE_VERSION`: `22`
- `PNPM_VERSION`: `10.28.0`
- 其他必要的环境变量

#### 步骤 5：启用预览评论

在 Vercel 项目设置中：
1. 进入 **Settings** → **Git**
2. 启用 **Preview Comments**
3. 这样 PR 中会自动显示预览链接

### 使用效果

配置完成后：
- ✅ 每次创建 PR，Vercel 会自动部署预览
- ✅ 在 PR 评论中会显示预览链接
- ✅ 预览链接格式：`https://your-app-xxx.vercel.app`
- ✅ 每次推送新提交，预览会自动更新

### 查看预览

1. **在 PR 评论中**：
   - Vercel bot 会自动评论预览链接
   - 点击链接即可访问

2. **在 Vercel Dashboard**：
   - 进入 Vercel 项目页面
   - 查看 **Deployments** 列表
   - 找到对应的 PR 部署

### 优势

- ✅ **自动部署**：无需手动操作
- ✅ **快速预览**：几分钟内完成部署
- ✅ **PR 集成**：自动在 PR 中显示链接
- ✅ **免费额度**：个人项目免费使用
- ✅ **支持 monorepo**：可以配置多个应用

## 🌐 方案 2：使用 Netlify

Netlify 是另一个流行的部署预览方案，适合静态网站和前端应用。

### 配置步骤

#### 步骤 1：连接 GitHub 仓库

1. 访问 [Netlify](https://www.netlify.com/)
2. 使用 GitHub 账号登录
3. 点击 **Add new site** → **Import an existing project**
4. 选择您的 GitHub 仓库

#### 步骤 2：配置构建设置

**Base directory**: 
```
apps/web
```

**Build command**: 
```bash
pnpm install && pnpm --filter @repo/web build
```

**Publish directory**: 
```
apps/web/dist
```

#### 步骤 3：创建 netlify.toml（推荐）

在项目根目录创建 `netlify.toml`：

```toml
[build]
  base = "apps/web"
  command = "pnpm install && pnpm --filter @repo/web build"
  publish = "apps/web/dist"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "10.28.0"

# PR 预览配置
[build.processing]
  skip_processing = false

# 插件配置（启用 PR 评论）
[[plugins]]
  package = "@netlify/plugin-github-preview-comments"
```

#### 步骤 4：安装 Netlify GitHub App

1. 在 Netlify 项目设置中
2. 进入 **Build & deploy** → **Deploy contexts**
3. 启用 **Deploy previews**
4. 安装 **Netlify GitHub App**（如果未安装）

### 使用效果

- ✅ PR 创建时自动部署预览
- ✅ PR 评论中显示预览链接
- ✅ 预览链接格式：`https://deploy-preview-xxx--your-app.netlify.app`

## 📦 方案 3：使用 Docker 本地预览（适合全栈应用）

如果您的项目使用 Docker，可以在本地预览 PR 分支的部署效果。

### 操作步骤

#### 步骤 1：Checkout PR 分支

```bash
# 获取 PR 分支
git fetch origin

# Checkout PR 分支
git checkout docs/optimize-github-docs
```

#### 步骤 2：构建 Docker 镜像

```bash
# 构建前端应用镜像
docker build -f apps/web/Dockerfile -t web:preview .

# 或使用 docker-compose
docker-compose build web
```

#### 步骤 3：启动预览环境

```bash
# 使用 docker-compose 启动
docker-compose up -d

# 或单独运行容器
docker run -d -p 3000:80 --name web-preview web:preview
```

#### 步骤 4：访问预览

根据项目配置：
- **Web 应用**: `http://web.example.com:8888`（需要配置 hosts）
- **Docs 应用**: `http://docs.example.com:8888`
- **Storybook**: `http://storybook.example.com:8888`

#### 步骤 5：清理预览环境

```bash
# 停止并删除容器
docker-compose down

# 或删除单个容器
docker rm -f web-preview
```

### 优势

- ✅ **完整环境**：包含所有服务（前端、后端、数据库等）
- ✅ **真实部署**：与实际生产环境一致
- ✅ **完全控制**：可以调试和修改

### 劣势

- ❌ **需要手动操作**：不能自动部署
- ❌ **资源消耗**：需要本地运行 Docker
- ❌ **时间较长**：构建和启动需要时间

## 🔧 方案 4：GitHub Actions + 临时环境（高级）

可以配置 GitHub Actions 在 PR 时自动部署到临时环境。

### 配置示例

创建 `.github/workflows/preview.yml`：

```yaml
name: Deploy Preview

on:
  pull_request:
    branches:
      - main

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.28.0
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm --filter @repo/web build
      
      - name: Deploy to preview environment
        # 这里可以使用 Vercel CLI、Netlify CLI 或其他部署工具
        run: |
          # 示例：使用 Vercel CLI
          npm i -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod=false
```

### 优势

- ✅ **完全自定义**：可以配置任何部署流程
- ✅ **集成 CI/CD**：与现有工作流集成

### 劣势

- ❌ **配置复杂**：需要编写工作流文件
- ❌ **需要服务器**：需要部署目标环境

## 📊 推荐方案选择

### 对于前端应用（React/Vue/Next.js）

**推荐：Vercel**
- ✅ 配置最简单
- ✅ 自动部署预览
- ✅ PR 集成完善
- ✅ 免费使用

### 对于静态网站

**推荐：Netlify 或 Vercel**
- ✅ 两者都支持静态网站
- ✅ 配置简单
- ✅ 免费使用

### 对于全栈应用（需要后端）

**推荐：Docker 本地预览**
- ✅ 可以预览完整环境
- ✅ 包含所有服务
- ⚠️ 需要手动操作

### 对于 Java 微服务

**推荐：Docker 本地预览**
- ✅ 可以预览完整微服务环境
- ✅ 包含数据库、注册中心等基础设施
- ✅ 与实际生产环境一致
- ⚠️ 需要手动操作
- ⚠️ 启动时间较长（5-10 分钟）

**详细指南**：请参考 [Java 微服务部署预览指南](./JAVA_DEPLOY_PREVIEW_GUIDE.md)

### 对于需要自定义部署流程

**推荐：GitHub Actions**
- ✅ 完全控制
- ✅ 可以集成任何部署工具
- ⚠️ 配置复杂

## 🎯 快速开始（Vercel）

### 1. 访问 Vercel

访问 [vercel.com](https://vercel.com) 并使用 GitHub 登录

### 2. 导入项目

1. 点击 **Add New Project**
2. 选择您的仓库
3. 配置项目设置（见上面的配置步骤）

### 3. 等待首次部署

Vercel 会自动部署主分支

### 4. 创建 PR 测试

1. 创建一个 PR
2. Vercel 会自动部署预览
3. 在 PR 评论中查看预览链接

## 📚 相关文档

- [Java 微服务部署预览指南](./JAVA_DEPLOY_PREVIEW_GUIDE.md) - Java 服务专用预览指南
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## ❓ 常见问题

### Q: 部署预览需要多长时间？

**A**: 
- Vercel/Netlify: 通常 2-5 分钟
- Docker 本地: 取决于构建时间，通常 5-10 分钟

### Q: 预览环境会保留多久？

**A**: 
- Vercel: PR 关闭后会自动删除
- Netlify: PR 关闭后会自动删除
- Docker 本地: 需要手动清理

### Q: 预览环境的数据会保留吗？

**A**: 
- 通常不会保留数据
- 每次部署都是全新的环境
- 如果需要测试数据，需要在部署时注入

### Q: 可以同时预览多个 PR 吗？

**A**: 
- ✅ 可以
- 每个 PR 都有独立的预览链接
- 不会相互影响

### Q: 预览环境会影响生产环境吗？

**A**: 
- ❌ 不会
- 预览环境是完全独立的
- 不会影响生产环境

## 💡 最佳实践

1. ✅ **优先使用 Vercel**：对于前端应用，Vercel 是最简单的选择
2. ✅ **配置自动部署**：让预览自动部署，无需手动操作
3. ✅ **在 PR 中查看预览**：预览链接会自动显示在 PR 评论中
4. ✅ **测试关键功能**：在预览环境中测试关键功能
5. ✅ **及时清理**：PR 关闭后预览会自动删除，无需手动清理
