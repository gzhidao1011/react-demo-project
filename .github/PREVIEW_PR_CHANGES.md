# 合并 PR 前预览更改效果指南

本文档说明如何在合并 PR 之前预览更改效果，确保更改符合预期后再合并。

## 📋 预览方法概览

GitHub 提供了多种方式来预览 PR 的更改效果：

| 方法 | 适用场景 | 预览内容 | 难度 |
|------|---------|---------|------|
| **Files changed** | 所有 PR | 代码差异对比 | ⭐ 简单 |
| **本地 checkout** | 所有 PR | 完整运行效果 | ⭐⭐ 中等 |
| **GitHub 预览** | Markdown/图片 | 渲染效果 | ⭐ 简单 |
| **部署预览** | 前端应用 | 实际运行效果 | ⭐⭐⭐ 需要配置 |

## 🔍 方法 1：在 GitHub 上查看代码差异（最简单）

### 查看位置

在 PR 页面点击 **Files changed** 标签。

### 功能说明

1. **代码差异对比**：
   - ✅ 显示所有更改的文件
   - ✅ 高亮显示新增、删除、修改的行
   - ✅ 显示行号，方便定位

2. **查看方式**：
   - **Unified view**（统一视图）：所有更改在一个视图中
   - **Split view**（分屏视图）：左右对比显示

3. **文件类型支持**：
   - ✅ 代码文件（.ts, .tsx, .js, .jsx 等）
   - ✅ 配置文件（.json, .yml, .yaml 等）
   - ✅ 文档文件（.md）
   - ✅ 样式文件（.css, .scss）

### 操作步骤

1. 打开 PR 页面
2. 点击 **Files changed** 标签
3. 浏览所有更改的文件
4. 点击文件名查看详细差异
5. 使用 `+` 和 `-` 按钮展开/折叠代码块

### 查看 Markdown 渲染效果

对于 `.md` 文件，GitHub 会自动渲染预览：

1. 在 **Files changed** 中打开 `.md` 文件
2. 点击右上角的 **View file** 按钮
3. 可以看到渲染后的 Markdown 效果

## 💻 方法 2：在本地 checkout PR 分支（推荐）

这是最可靠的方法，可以在本地完整运行和测试更改。

### 操作步骤

#### 步骤 1：获取 PR 分支信息

在 PR 页面可以看到：
- **分支名称**：例如 `docs/optimize-github-docs`
- **作者**：例如 `gzhidao1011`

#### 步骤 2：在本地 checkout PR 分支

```bash
# 方法 A：使用 GitHub CLI（如果已安装）
gh pr checkout <PR_NUMBER>

# 方法 B：手动 checkout
# 1. 获取 PR 分支的最新代码
git fetch origin

# 2. checkout PR 分支
git checkout docs/optimize-github-docs

# 3. 如果分支不存在，先获取远程分支
git fetch origin docs/optimize-github-docs:docs/optimize-github-docs
git checkout docs/optimize-github-docs
```

#### 步骤 3：运行和测试

```bash
# 安装依赖（如果需要）
pnpm install

# 运行类型检查
pnpm check:types

# 运行代码检查
pnpm check

# 运行测试
pnpm test

# 启动开发服务器（如果是前端应用）
pnpm dev
# 或
pnpm -C apps/web dev
```

#### 步骤 4：查看更改效果

- **代码文件**：在编辑器中查看代码
- **文档文件**：在编辑器中查看，或使用 Markdown 预览
- **前端应用**：在浏览器中访问 `http://localhost:xxxx` 查看效果
- **配置文件**：检查配置是否正确

#### 步骤 5：切换回主分支

测试完成后，切换回主分支：

```bash
git checkout main
git pull origin main
```

### 优势

- ✅ **完整预览**：可以看到所有更改的实际效果
- ✅ **运行测试**：可以在本地运行测试和检查
- ✅ **调试方便**：如果发现问题，可以直接修改
- ✅ **安全可靠**：不会影响远程仓库

## 🌐 方法 3：使用 GitHub 预览功能

### Markdown 文件预览

GitHub 会自动渲染 Markdown 文件：

1. 在 PR 的 **Files changed** 中
2. 点击 `.md` 文件
3. 点击 **View file** 查看渲染效果

### 图片文件预览

1. 在 PR 的 **Files changed** 中
2. 点击图片文件（.png, .jpg, .svg 等）
3. GitHub 会自动显示图片预览

### 配置文件预览

对于 JSON、YAML 等配置文件：
1. 在 **Files changed** 中打开文件
2. GitHub 会高亮显示语法
3. 可以检查格式是否正确

## 🚀 方法 4：部署预览（推荐用于前端应用）

部署预览是最直观的方法，可以在浏览器中查看实际运行效果。

### 方案对比

| 方案 | 配置难度 | 适用场景 | 推荐度 |
|------|---------|---------|--------|
| **Vercel** | ⭐ 简单 | React/Vue/Next.js | ⭐⭐⭐⭐⭐ |
| **Netlify** | ⭐ 简单 | 静态网站/前端应用 | ⭐⭐⭐⭐ |
| **Docker 本地** | ⭐⭐⭐ 中等 | 全栈应用 | ⭐⭐⭐⭐ |

### 使用 Vercel（推荐）

**配置步骤**：

1. 访问 [Vercel](https://vercel.com/) 并使用 GitHub 登录
2. 点击 **Add New Project**，选择您的仓库
3. 配置项目设置：
   - **Root Directory**: `apps/web`（如果是 monorepo）
   - **Build Command**: `pnpm --filter @repo/web build`
   - **Output Directory**: `apps/web/dist`（根据实际构建输出调整）
   - **Install Command**: `pnpm install`
4. 启用 **Preview Comments**（在 Settings → Git 中）

**使用效果**：
- ✅ 每次创建 PR，Vercel 自动部署预览
- ✅ PR 评论中自动显示预览链接
- ✅ 每次推送新提交，预览自动更新
- ✅ PR 关闭后，预览自动删除

**查看预览**：
- 在 PR 评论中查找 Vercel bot 的评论
- 点击预览链接访问：`https://your-app-xxx.vercel.app`

### 使用 Netlify

**配置步骤**：

1. 访问 [Netlify](https://www.netlify.com/) 并使用 GitHub 登录
2. 点击 **Add new site** → **Import an existing project**
3. 选择您的仓库并配置构建设置
4. 安装 **Netlify GitHub App** 启用 PR 预览

**查看预览**：
- PR 评论中显示预览链接：`https://deploy-preview-xxx--your-app.netlify.app`

### 使用 Docker 本地预览

**操作步骤**：

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout docs/optimize-github-docs

# 2. 构建 Docker 镜像
docker-compose build web

# 3. 启动预览环境
docker-compose up -d

# 4. 访问预览（根据项目配置）
# Web: http://web.example.com:8888
# Docs: http://docs.example.com:8888

# 5. 预览完成后清理
docker-compose down
```

**详细配置**：请参考 [部署预览完整指南](./DEPLOY_PREVIEW_GUIDE.md)

## 📊 合并前检查清单

在预览更改后，确认以下内容：

### ✅ 代码更改

- [ ] 代码逻辑正确
- [ ] 没有引入 bug
- [ ] 遵循项目代码风格
- [ ] 没有引入调试代码（console.log 等）
- [ ] 没有引入敏感信息（API 密钥、密码等）

### ✅ 文档更改

- [ ] 内容准确无误
- [ ] 格式正确（Markdown 渲染正常）
- [ ] 链接有效
- [ ] 拼写和语法正确

### ✅ 配置更改

- [ ] 配置文件格式正确
- [ ] 配置项有效
- [ ] 不会破坏现有功能

### ✅ 测试

- [ ] 本地测试通过
- [ ] CI 检查通过
- [ ] 功能正常工作

## 🎯 实际示例

### 示例 1：预览文档更改

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout docs/optimize-github-docs

# 2. 在编辑器中打开文档文件
code .github/ADD_COLLABORATOR.md

# 3. 使用 Markdown 预览查看渲染效果
# VS Code: 按 Ctrl+Shift+V (Windows) 或 Cmd+Shift+V (Mac)

# 4. 检查内容是否正确
# - 标题层级是否正确
# - 列表格式是否正确
# - 链接是否有效

# 5. 切换回主分支
git checkout main
```

### 示例 2：预览前端代码更改

```bash
# 1. Checkout PR 分支
git fetch origin
git checkout feature/new-feature

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm -C apps/web dev

# 4. 在浏览器中访问 http://localhost:5173
# 5. 测试新功能是否正常工作

# 6. 运行测试
pnpm test

# 7. 切换回主分支
git checkout main
```

### 示例 3：在 GitHub 上预览

1. **打开 PR 页面**
2. **点击 Files changed 标签**
3. **查看代码差异**：
   - 绿色背景 = 新增代码
   - 红色背景 = 删除代码
   - 黄色背景 = 修改代码
4. **点击文件名**查看详细差异
5. **对于 .md 文件**，点击 **View file** 查看渲染效果

## 💡 最佳实践

### 1. 始终预览后再合并

- ✅ 即使是小改动，也要预览
- ✅ 确保更改符合预期
- ✅ 避免引入意外问题

### 2. 使用本地 checkout（推荐）

- ✅ 最可靠的预览方法
- ✅ 可以运行测试和检查
- ✅ 可以调试问题

### 3. 结合多种方法

- ✅ GitHub 上查看代码差异（快速）
- ✅ 本地 checkout 运行测试（可靠）
- ✅ 部署预览查看实际效果（如果可用）

### 4. 记录预览结果

在 PR 评论中记录：
- ✅ 预览了哪些内容
- ✅ 测试了哪些功能
- ✅ 发现了哪些问题（如果有）

## 🔧 故障排除

### 问题 1：无法 checkout PR 分支

**解决方案**：
```bash
# 确保获取了最新的远程分支信息
git fetch origin

# 如果分支不存在，尝试获取所有远程分支
git fetch --all

# 然后 checkout
git checkout docs/optimize-github-docs
```

### 问题 2：本地运行失败

**可能原因**：
- 依赖未安装
- 环境变量未配置
- 端口被占用

**解决方案**：
```bash
# 重新安装依赖
pnpm install

# 检查环境变量
cat .env.example

# 检查端口占用
netstat -ano | findstr :5173  # Windows
lsof -i :5173  # Mac/Linux
```

### 问题 3：GitHub 预览不显示

**可能原因**：
- 文件类型不支持预览
- 文件太大
- 网络问题

**解决方案**：
- 使用本地 checkout 方法
- 在编辑器中查看文件

## 📚 相关文档

- [如何合并 PR](./HOW_TO_MERGE_PR.md)
- [PR 工作流程指南](./PR_WORKFLOW.md)
- [测试 PR 创建指南](./TEST_PR_GUIDE.md)

## ❓ 常见问题

### Q: 必须预览才能合并吗？

**A**: 
- 强烈建议预览后再合并
- 特别是对于重要更改
- 可以避免引入问题

### Q: 哪种预览方法最好？

**A**: 
- **本地 checkout**：最可靠，推荐使用
- **GitHub Files changed**：快速查看代码差异
- **部署预览**：查看实际运行效果（如果配置了）

### Q: 预览需要多长时间？

**A**: 
- GitHub 预览：即时
- 本地 checkout：几分钟（取决于项目大小）
- 部署预览：几分钟到十几分钟（取决于部署配置）

### Q: 可以跳过预览直接合并吗？

**A**: 
- 不推荐
- 特别是对于重要更改
- 小改动可以快速预览后合并
