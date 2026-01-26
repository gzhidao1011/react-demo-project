# GitHub PR 合并方式对比详解

本文档详细说明 GitHub PR 合并时三种方式的区别、使用场景和效果。

## 📊 三种合并方式对比

### 方式 1：Create a merge commit（创建合并提交）

**GitHub 显示**：
> "All commits from this branch will be added to the base branch via a merge commit."

**中文说明**：
> "此分支的所有提交将通过合并提交添加到基础分支。"

#### 工作原理

```
主分支 (main):     A---B---C-----------M
                      \               /
PR 分支 (feature):     D---E---F---G
```

**效果**：
- ✅ 保留 PR 分支中的所有提交（D, E, F, G）
- ✅ 创建一个合并提交（M）连接两个分支
- ✅ 保留完整的分支历史
- ✅ 可以看到 PR 中的所有提交记录

#### 提交历史示例

```bash
*   Merge pull request #123 from user/feature-branch (合并提交 M)
|\
| * Commit G (PR 中的提交)
| * Commit F (PR 中的提交)
| * Commit E (PR 中的提交)
| * Commit D (PR 中的提交)
|/
* Commit C (主分支的提交)
* Commit B
* Commit A
```

#### 适用场景

- ✅ 需要保留 PR 的完整提交历史
- ✅ 希望看到 PR 开发过程中的所有提交
- ✅ 团队需要详细的提交记录
- ✅ PR 包含重要的中间提交

#### 优点

- ✅ 保留完整的开发历史
- ✅ 可以追溯每个提交的变更
- ✅ 适合需要详细历史的项目

#### 缺点

- ❌ 主分支历史可能变得复杂
- ❌ 合并提交较多时难以阅读
- ❌ 不适合频繁合并的小 PR

---

### 方式 2：Squash and merge（压缩合并）⭐ 推荐

**GitHub 显示**：
> "The 1 commit from this branch will be added to the base branch."

**中文说明**：
> "此分支的 1 个提交将被添加到基础分支。"

**注意**：如果 PR 有多个提交，会显示 "The X commits from this branch will be squashed and merged into 1 commit."

#### 工作原理

```
主分支 (main):     A---B---C---S
                      \       /
PR 分支 (feature):     D---E---F---G
                        (压缩为一个提交 S)
```

**效果**：
- ✅ 将 PR 的所有提交（D, E, F, G）压缩为一个提交（S）
- ✅ 提交信息使用 PR 的标题和描述
- ✅ 主分支历史保持线性
- ✅ 主分支历史更清晰易读

#### 提交历史示例

```bash
* Commit S: feat: 添加新功能 (压缩后的提交)
* Commit C (主分支的提交)
* Commit B
* Commit A
```

#### 适用场景

- ✅ **大多数情况推荐使用** ⭐
- ✅ PR 包含多个小提交，希望合并为一个
- ✅ 希望保持主分支历史整洁
- ✅ 不需要保留 PR 的详细提交历史
- ✅ 团队使用 Conventional Commits 规范

#### 优点

- ✅ 主分支历史清晰整洁
- ✅ 每个 PR 对应一个提交，易于理解
- ✅ 提交信息规范（使用 PR 标题）
- ✅ 适合频繁合并的项目

#### 缺点

- ❌ 丢失 PR 中的详细提交历史
- ❌ 无法追溯 PR 开发过程中的中间提交
- ❌ 如果 PR 很大，单个提交可能包含很多变更

---

### 方式 3：Rebase and merge（变基合并）

**GitHub 显示**：
> "The 1 commit from this branch will be rebased and added to the base branch."

**中文说明**：
> "此分支的 1 个提交将被变基并添加到基础分支。"

**注意**：如果 PR 有多个提交，会显示 "The X commits from this branch will be rebased and added to the base branch."

#### 工作原理

```
主分支 (main):     A---B---C---D'---E'---F'---G'
                      \       /
PR 分支 (feature):     D---E---F---G
                        (变基后重新应用到主分支)
```

**效果**：
- ✅ 将 PR 的提交（D, E, F, G）重新应用到主分支最新提交之后
- ✅ 创建新的提交（D', E', F', G'），但内容相同
- ✅ 不创建合并提交
- ✅ 主分支历史是线性的

#### 提交历史示例

```bash
* Commit G' (变基后的提交)
* Commit F' (变基后的提交)
* Commit E' (变基后的提交)
* Commit D' (变基后的提交)
* Commit C (主分支的提交)
* Commit B
* Commit A
```

#### 适用场景

- ✅ 希望保持主分支历史完全线性
- ✅ 不使用合并提交
- ✅ 团队偏好 rebase 工作流
- ✅ PR 提交数量不多且逻辑清晰

#### 优点

- ✅ 主分支历史完全线性，无合并提交
- ✅ 保留 PR 中的所有提交
- ✅ 历史记录清晰易读
- ✅ 适合需要线性历史的项目

#### 缺点

- ❌ 重写了提交历史（提交 SHA 会改变）
- ❌ 如果 PR 有多个提交，可能产生很多提交
- ❌ 不适合频繁合并的项目
- ❌ 如果 PR 很大，历史可能变得很长

---

## 📊 三种方式对比表

| 特性 | Create a merge commit | Squash and merge | Rebase and merge |
|------|----------------------|------------------|------------------|
| **保留提交历史** | ✅ 完整保留 | ❌ 压缩为一个 | ✅ 保留但重写 |
| **合并提交** | ✅ 创建 | ❌ 不创建 | ❌ 不创建 |
| **主分支历史** | 分支结构 | 线性 | 线性 |
| **提交 SHA** | 不变 | 新 SHA | 新 SHA |
| **历史清晰度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **适用场景** | 需要详细历史 | 大多数情况 | 需要线性历史 |
| **推荐度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 实际示例

假设有一个 PR，包含 3 个提交：

```
PR 分支提交：
- feat: 添加用户登录功能
- fix: 修复登录验证问题
- docs: 更新登录文档
```

### 方式 1：Create a merge commit

**主分支历史**：
```
*   Merge pull request #123: 添加用户登录功能
|\
| * docs: 更新登录文档
| * fix: 修复登录验证问题
| * feat: 添加用户登录功能
|/
* 之前的提交...
```

### 方式 2：Squash and merge

**主分支历史**：
```
* feat: 添加用户登录功能 (压缩后的单个提交)
* 之前的提交...
```

**提交信息**（可编辑）：
```
feat: 添加用户登录功能

- 添加用户登录功能
- 修复登录验证问题
- 更新登录文档

Closes #123
```

### 方式 3：Rebase and merge

**主分支历史**：
```
* docs: 更新登录文档 (变基后的提交)
* fix: 修复登录验证问题 (变基后的提交)
* feat: 添加用户登录功能 (变基后的提交)
* 之前的提交...
```

## 💡 推荐选择

### 大多数情况：Squash and merge ⭐

**原因**：
- ✅ 保持主分支历史整洁
- ✅ 每个 PR 对应一个提交，易于理解
- ✅ 提交信息规范（使用 PR 标题）
- ✅ 适合频繁合并的项目

### 需要详细历史：Create a merge commit

**原因**：
- ✅ 保留完整的开发过程
- ✅ 可以追溯每个提交的变更
- ✅ 适合需要详细记录的项目

### 需要线性历史：Rebase and merge

**原因**：
- ✅ 完全线性的历史
- ✅ 无合并提交
- ✅ 适合偏好 rebase 的团队

## 🔍 如何查看合并后的历史

### 查看提交历史

```bash
# 查看提交历史（图形化）
git log --oneline --graph --all

# 查看合并提交
git log --merges

# 查看特定 PR 的提交
git log --grep="PR #123"
```

### 在 GitHub 上查看

1. 进入仓库页面
2. 点击 **Commits** 标签
3. 查看提交历史

## 📚 相关文档

- [如何合并 PR](./HOW_TO_MERGE_PR.md)
- [PR 工作流程指南](./PR_WORKFLOW.md)

## ❓ 常见问题

### Q: 哪种方式最常用？

**A**: **Squash and merge** 是最常用的方式，因为它能保持主分支历史整洁。

### Q: 合并后可以改变提交信息吗？

**A**: 
- **Squash and merge**：可以编辑提交信息
- **Create a merge commit**：可以编辑合并提交信息
- **Rebase and merge**：不能编辑（提交已应用）

### Q: 合并后提交 SHA 会改变吗？

**A**: 
- **Create a merge commit**：PR 分支的提交 SHA 不变
- **Squash and merge**：创建新的提交，SHA 会改变
- **Rebase and merge**：重写提交，SHA 会改变

### Q: 哪种方式适合大型 PR？

**A**: 
- **Squash and merge**：适合大型 PR，合并为一个提交
- **Create a merge commit**：如果 PR 中的提交很重要，可以保留
- **Rebase and merge**：不适合大型 PR（会产生很多提交）

### Q: 团队如何统一选择？

**A**: 
- 在团队文档中明确说明默认使用哪种方式
- 大多数团队使用 **Squash and merge**
- 特殊情况可以灵活选择
