# 测试 PR 创建指南

本文档说明如何创建一个测试 PR 来验证所有配置是否正常工作。

## 📋 测试目标

通过创建测试 PR，验证以下功能：

- ✅ PR 模板是否自动填充
- ✅ CI/CD 工作流是否正常运行
- ✅ CODEOWNERS 是否自动分配审查者
- ✅ Codecov 是否显示覆盖率（如果已配置）
- ✅ 所有检查是否通过

## 🚀 创建测试 PR 的步骤

### 步骤 1：创建测试分支

在项目根目录打开终端，执行：

```bash
# 确保在主分支
git checkout main

# 拉取最新代码
git pull origin main

# 创建测试分支
git checkout -b test/pr-integration-test
```

### 步骤 2：进行小的代码变更

为了触发 CI/CD，我们需要做一些小的变更。建议修改一个简单的文件。

#### 选项 A：修改 README（推荐，最安全）

如果项目有 README.md：

```bash
# 编辑 README.md，添加一行测试内容
echo "" >> README.md
echo "<!-- Test PR: 验证 PR 集成功能 -->" >> README.md
```

或者手动编辑 README.md，添加一行注释。

#### 选项 B：修改配置文件（如果 README 不存在）

```bash
# 在 package.json 的 description 中添加测试标记
# 使用你喜欢的编辑器打开 package.json
# 在 description 字段添加测试内容
```

#### 选项 C：创建一个测试文件（最简单）

```bash
# 创建一个测试文件
echo "# Test PR Integration" > .github/TEST.md
echo "" >> .github/TEST.md
echo "This is a test PR to verify PR integration features." >> .github/TEST.md
```

### 步骤 3：提交变更

```bash
# 查看变更
git status

# 添加变更的文件
git add .

# 提交（遵循 Conventional Commits 规范）
git commit -m "test: 验证 PR 集成功能"

# 推送到远程仓库
git push origin test/pr-integration-test
```

### 步骤 4：在 GitHub 上创建 PR

1. **打开 GitHub 仓库页面**
   - 访问你的 GitHub 仓库
   - 通常会看到提示："Compare & pull request"

2. **点击 "Compare & pull request"**
   - 如果没有看到提示，点击 **Pull requests** 标签
   - 点击 **New pull request** 按钮
   - 选择分支：`test/pr-integration-test` → `main`

3. **填写 PR 信息**
   - PR 模板应该会自动填充
   - 填写以下内容：
     - **标题**：`test: 验证 PR 集成功能`
     - **描述**：按照模板填写
     - **变更类型**：勾选 `🧪 测试相关`
     - **影响范围**：根据实际修改的文件勾选

4. **创建 PR**
   - 点击 **Create pull request** 按钮

### 步骤 5：验证功能

创建 PR 后，等待几分钟让 CI/CD 运行，然后检查以下内容：

#### ✅ 1. PR 模板验证

**检查位置**：PR 页面顶部的描述部分

**预期结果**：
- PR 模板已自动填充
- 包含所有必要的字段和检查清单

**如果未自动填充**：
- 检查 `.github/PULL_REQUEST_TEMPLATE.md` 文件是否存在
- 确认文件名和路径正确

#### ✅ 2. CODEOWNERS 验证

**检查位置**：PR 页面右侧的 **Reviewers** 部分

**预期结果**：
- 自动分配了审查者：`@gzhidao1011`
- 显示 "Review required" 或 "Changes requested"

**如果未自动分配**：
- 检查 `.github/CODEOWNERS` 文件是否存在
- 确认文件路径规则是否匹配修改的文件
- 确认用户名是否正确（`@gzhidao1011`）

#### ✅ 3. CI/CD 工作流验证

**检查位置**：PR 页面底部的 **Checks** 部分

**预期结果**：
- `Test / test` 工作流正在运行或已完成
- 所有步骤显示 ✅（绿色）：
  - ✅ Checkout repository
  - ✅ Install pnpm
  - ✅ Set up Node.js
  - ✅ Install dependencies
  - ✅ Type check
  - ✅ Lint and format check
  - ✅ Run tests
  - ✅ Generate test coverage
  - ✅ Upload coverage reports
  - ✅ Upload coverage to Codecov（如果已配置）
  - ✅ Test Summary

**如果失败**：
- 点击工作流名称查看详细日志
- 根据错误信息修复问题
- 推送新提交触发重新运行

#### ✅ 4. Codecov 验证（如果已配置）

**检查位置**：PR 页面的评论部分

**预期结果**：
- Codecov bot 自动评论覆盖率信息
- 显示覆盖率变化和徽章

**如果未显示**：
- 检查 `CODECOV_TOKEN` Secret 是否已配置
- 查看工作流日志中的 Codecov 上传步骤
- 参考 `.github/CODECOV_SETUP.md` 进行故障排除

#### ✅ 5. 覆盖率报告验证

**检查位置**：工作流运行页面的 Artifacts 部分

**预期结果**：
- `coverage-reports` artifact 已上传
- 可以下载并查看覆盖率报告

**查看方法**：
1. 点击 PR 页面底部的 **Checks**
2. 点击 `Test / test` 工作流
3. 滚动到底部找到 **Artifacts** 部分
4. 下载 `coverage-reports.zip`
5. 解压后查看 `coverage/lcov-report/index.html`

## 📊 验证检查清单

创建测试 PR 后，使用以下检查清单验证：

### PR 模板
- [ ] PR 模板已自动填充
- [ ] 所有字段都可以填写
- [ ] 检查清单显示正常

### CODEOWNERS
- [ ] 审查者已自动分配（`@gzhidao1011`）
- [ ] 审查者收到通知

### CI/CD 工作流
- [ ] 工作流自动触发
- [ ] 所有步骤成功运行
- [ ] 类型检查通过
- [ ] 代码检查通过
- [ ] 测试通过
- [ ] 覆盖率报告生成

### Codecov（如果已配置）
- [ ] Codecov bot 自动评论
- [ ] 覆盖率信息显示正常
- [ ] 覆盖率徽章显示

### 覆盖率报告
- [ ] Artifacts 已上传
- [ ] 可以下载覆盖率报告
- [ ] HTML 报告可以正常打开

## 🔧 故障排除

### 问题 1：PR 模板未自动填充

**解决方案**：
1. 确认文件路径：`.github/PULL_REQUEST_TEMPLATE.md`
2. 确认文件名正确（区分大小写）
3. 尝试刷新页面或重新创建 PR

### 问题 2：CODEOWNERS 未分配审查者

**解决方案**：
1. 检查 `.github/CODEOWNERS` 文件是否存在
2. 确认文件路径规则是否匹配修改的文件
3. 确认用户名是否正确（`@gzhidao1011`）
4. 检查 CODEOWNERS 语法是否正确

### 问题 3：CI/CD 工作流未触发

**解决方案**：
1. 检查工作流文件路径：`.github/workflows/test.yml`
2. 确认修改的文件路径匹配工作流的 `paths` 配置
3. 检查工作流文件语法是否正确
4. 查看 GitHub Actions 页面是否有错误信息

### 问题 4：CI/CD 工作流失败

**解决方案**：
1. 点击工作流名称查看详细日志
2. 根据错误信息修复问题
3. 常见问题：
   - 依赖安装失败：检查 `pnpm-lock.yaml` 是否最新
   - 类型检查失败：修复类型错误
   - 代码检查失败：运行 `pnpm check` 修复问题
   - 测试失败：修复失败的测试用例

### 问题 5：Codecov 未显示

**解决方案**：
1. 检查 `CODECOV_TOKEN` Secret 是否已配置
2. 查看工作流日志中的 Codecov 上传步骤
3. 确认覆盖率文件路径正确
4. 参考 `.github/CODECOV_SETUP.md` 进行配置

## ✅ 测试完成后

### 如果所有检查都通过

恭喜！所有 PR 集成功能正常工作。你可以：

1. **合并测试 PR**（可选）：
   - 如果测试变更很小且无害，可以合并
   - 或者直接关闭 PR

2. **删除测试分支**：
   ```bash
   git checkout main
   git branch -d test/pr-integration-test
   git push origin --delete test/pr-integration-test
   ```

### 如果有问题

1. **记录问题**：记录哪些功能未正常工作
2. **查看文档**：参考相关文档进行故障排除
3. **修复问题**：根据错误信息修复配置
4. **重新测试**：修复后重新创建测试 PR

## 📚 相关文档

- [PR 集成功能说明](./PR_INTEGRATION.md)
- [PR 工作流程指南](./PR_WORKFLOW.md)
- [Codecov 配置指南](./CODECOV_SETUP.md)
- [分支保护规则配置指南](./BRANCH_PROTECTION.md)

## 💡 提示

- **测试变更要小**：只做最小的变更来触发 CI/CD
- **使用测试分支**：不要在主分支上直接测试
- **及时清理**：测试完成后删除测试分支
- **记录问题**：如果发现问题，及时记录和修复
