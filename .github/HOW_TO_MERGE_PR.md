# 如何合并 PR

本文档说明如何在 GitHub 上合并 Pull Request，包括合并前的检查、合并方式选择等。

## ⚠️ 合并前检查清单

在合并 PR 之前，**必须**确保完成以下检查：

### ✅ 1. CI/CD 检查通过

**检查位置**：PR 页面底部的 **Checks** 部分

**必须满足**：
- [ ] `Test / test` 工作流显示 ✅（绿色）
- [ ] 所有步骤都成功：
  - [ ] 类型检查通过
  - [ ] 代码检查（lint、format）通过
  - [ ] 测试通过
  - [ ] 覆盖率报告生成成功

**如果失败**：
- ❌ **禁止合并**，必须先修复问题
- 查看工作流日志，找到失败原因
- 修复问题后推送新提交
- 等待 CI 重新运行并通过

### ✅ 2. 代码审查

**检查位置**：PR 页面右侧的 **Reviewers** 部分

**必须满足**：
- [ ] CODEOWNERS 指定的审查者已审批（显示 ✅）
- [ ] 至少 1 个审查者审批（如果配置了 CODEOWNERS）
- [ ] 所有审查评论已解决

**如果未审批**：
- ❌ **禁止合并**，必须等待审查者审批
- 如果审查者提出修改建议，需要先修改代码

### ✅ 3. PR 描述完整

**检查位置**：PR 页面顶部的描述部分

**建议满足**：
- [ ] PR 描述清晰说明变更目的
- [ ] 已勾选变更类型
- [ ] 已说明影响范围

### ✅ 4. 分支同步

**检查位置**：PR 页面顶部的分支状态

**必须满足**：
- [ ] 分支与主分支同步（显示 "This branch is up to date"）
- [ ] 或已解决合并冲突

**如果不同步**：
- ❌ **禁止合并**，必须先同步分支
- 参考下面的"同步分支"部分

## 🔄 同步分支（如果需要）

如果 PR 分支与主分支不同步，需要先同步：

### 方法 1：在 GitHub 上更新分支（推荐）

1. 在 PR 页面点击 **Update branch** 按钮
2. GitHub 会自动合并主分支的最新更改
3. 如果有冲突，需要解决冲突后推送

### 方法 2：使用命令行同步

```bash
# 切换到 PR 分支
git checkout your-branch-name

# 方法 A：Rebase（推荐，保持历史整洁）
git fetch origin
git rebase origin/main
# 如果有冲突，解决冲突后：
git add .
git rebase --continue
git push --force-with-lease

# 方法 B：Merge（保留合并历史）
git fetch origin
git merge origin/main
# 如果有冲突，解决冲突后：
git add .
git commit -m "chore: merge main into branch"
git push
```

## 📋 合并 PR 的步骤

### 步骤 1：打开 PR 页面

1. 进入 GitHub 仓库页面
2. 点击 **Pull requests** 标签
3. 找到要合并的 PR 并点击打开

### 步骤 2：确认所有检查通过

在 PR 页面确认：

- ✅ **Checks** 部分：所有 CI 检查通过（绿色 ✅）
- ✅ **Reviewers** 部分：审查者已审批
- ✅ **Conversation** 部分：所有评论已解决
- ✅ 分支状态：与主分支同步

### 步骤 3：选择合并方式

在 PR 页面底部，点击 **Merge pull request** 下拉菜单，选择合并方式：

#### 方式 1：Squash and merge（推荐）⭐

**适用场景**：
- PR 包含多个提交，但希望合并为一个提交
- 保持主分支历史整洁
- 大多数情况推荐使用

**效果**：
- 将 PR 的所有提交合并为一个提交
- 提交信息使用 PR 的标题和描述
- 主分支历史更清晰

**操作**：
1. 点击 **Squash and merge**
2. 可以编辑提交信息（默认使用 PR 标题和描述）
3. 点击 **Confirm squash and merge**

#### 方式 2：Create a merge commit

**适用场景**：
- 需要保留 PR 的完整提交历史
- 希望看到 PR 中的所有提交记录

**效果**：
- 保留 PR 中的所有提交
- 创建一个合并提交（merge commit）
- 主分支历史包含所有提交记录

**操作**：
1. 点击 **Create a merge commit**
2. 点击 **Confirm merge**

#### 方式 3：Rebase and merge

**适用场景**：
- 希望将 PR 的提交直接应用到主分支
- 不使用合并提交，保持线性历史

**效果**：
- 将 PR 的提交 rebase 到主分支
- 不创建合并提交
- 主分支历史是线性的

**操作**：
1. 点击 **Rebase and merge**
2. 点击 **Confirm rebase and merge**

**注意**：如果 PR 分支有多个提交，rebase 可能会重写提交历史。

### 步骤 4：确认合并

1. 选择合并方式后，点击确认按钮
2. GitHub 会执行合并操作
3. 合并完成后，会显示成功消息

### 步骤 5：删除分支（可选）

合并完成后，GitHub 会提示删除分支：

- **Delete branch**：删除远程分支
- **Restore branch**：恢复已删除的分支（如果需要）

**建议**：
- ✅ 删除已合并的分支（保持仓库整洁）
- ✅ 如果还需要该分支，可以稍后删除

## 🚫 禁止的操作

以下情况**禁止**合并 PR：

- ❌ **CI 检查失败**：必须先修复问题
- ❌ **未获得审查者审批**：必须等待审批
- ❌ **有未解决的评论**：必须先解决所有评论
- ❌ **分支未同步**：必须先同步分支
- ❌ **有合并冲突**：必须先解决冲突
- ❌ **PR 标记为 Draft**：必须先标记为 Ready for review

## 🔧 解决合并冲突

如果 PR 与主分支有冲突：

### 方法 1：在 GitHub 上解决（简单冲突）

1. 在 PR 页面点击 **Resolve conflicts**
2. GitHub 会显示冲突文件
3. 编辑文件，解决冲突（删除冲突标记，保留正确的代码）
4. 点击 **Mark as resolved**
5. 点击 **Commit merge**

### 方法 2：在本地解决（复杂冲突）

```bash
# 1. 切换到 PR 分支
git checkout your-branch-name

# 2. 拉取主分支最新代码
git fetch origin
git merge origin/main

# 3. 解决冲突
# 编辑冲突文件，解决冲突

# 4. 提交解决后的代码
git add .
git commit -m "chore: resolve merge conflicts"

# 5. 推送到远程
git push
```

## 📊 合并方式对比

| 合并方式 | GitHub 提示信息 | 提交历史 | 适用场景 | 推荐度 |
|---------|---------------|---------|---------|--------|
| **Create a merge commit** | "All commits from this branch will be added to the base branch via a merge commit." | 保留所有提交 + 合并提交 | 需要完整历史 | ⭐⭐⭐ |
| **Squash and merge** | "The X commits from this branch will be squashed and merged into 1 commit." | 压缩为单个提交 | 大多数情况 | ⭐⭐⭐⭐⭐ |
| **Rebase and merge** | "The X commits from this branch will be rebased and added to the base branch." | 线性历史，无合并提交 | 需要线性历史 | ⭐⭐⭐⭐ |

**详细对比说明**：请参考 [合并方式对比详解](./MERGE_METHODS_COMPARISON.md)

## 💡 最佳实践

### 合并前

1. ✅ **仔细审查代码**：确保代码质量
2. ✅ **运行本地测试**：在合并前本地验证
3. ✅ **检查 CI 日志**：确认没有隐藏的问题
4. ✅ **确认审查者审批**：获得必要的审批

### 合并时

1. ✅ **使用 Squash and merge**：保持历史整洁（推荐）
2. ✅ **编辑提交信息**：确保提交信息清晰
3. ✅ **删除已合并的分支**：保持仓库整洁

### 合并后

1. ✅ **验证合并结果**：确认代码正确合并
2. ✅ **检查主分支状态**：确认 CI 检查通过
3. ✅ **通知团队**：如果有重要变更，通知团队成员

## 🔍 查看合并历史

合并后，可以在以下位置查看：

1. **主分支提交历史**：
   - 进入仓库页面
   - 点击 **Commits** 标签
   - 查看最新的提交

2. **PR 列表**：
   - 进入 **Pull requests** 标签
   - 筛选 "Merged" 查看已合并的 PR

3. **Git 日志**：
   ```bash
   git log --oneline --graph
   ```

## 📚 相关文档

- [PR 工作流程指南](./PR_WORKFLOW.md)
- [PR 集成功能说明](./PR_INTEGRATION.md)
- [测试 PR 创建指南](./TEST_PR_GUIDE.md)

## ❓ 常见问题

### Q: 合并后可以撤销吗？

**A**: 可以，但需要谨慎操作：
- 如果刚合并，可以使用 `git revert` 创建一个撤销提交
- 如果已经推送，需要创建新的 PR 来修复

### Q: 合并后 PR 会自动关闭吗？

**A**: 是的，合并后 PR 会自动关闭。

### Q: 可以重新打开已合并的 PR 吗？

**A**: 不可以，但可以创建新的 PR 来修复问题。

### Q: 合并后如何查看变更？

**A**: 
- 在 PR 页面查看 **Files changed** 标签
- 在主分支的提交历史中查看合并提交

### Q: 合并冲突如何解决？

**A**: 参考上面的"解决合并冲突"部分。
