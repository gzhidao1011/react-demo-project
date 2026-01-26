# 分支保护规则配置指南

本文档说明如何在 GitHub 仓库中配置分支保护规则，确保代码质量和项目稳定性。

## 📋 配置步骤

### 1. 进入仓库设置

1. 打开 GitHub 仓库页面
2. 点击 **Settings**（设置）标签
3. 在左侧菜单中找到 **Branches**（分支）

### 2. 添加分支保护规则

点击 **Add rule**（添加规则）或 **Add branch protection rule**（添加分支保护规则）

### 3. 配置 main 分支保护规则

#### 基本设置

**Branch name pattern（分支名称模式）**：
```
main
```

#### 保护规则配置

##### ✅ 必须启用的规则

1. **Require a pull request before merging（合并前需要 PR）**
   - ✅ 启用
   - **Require approvals（需要审批）**：至少 `1` 个审批
   - **Dismiss stale pull request approvals when new commits are pushed（推送新提交时撤销过期的 PR 审批）**：✅ 启用
   - **Require review from Code Owners（需要 CODEOWNERS 审查）**：✅ 启用（如果配置了 CODEOWNERS）

2. **Require status checks to pass before merging（合并前需要通过状态检查）**
   - ✅ 启用
   - **Require branches to be up to date before merging（合并前要求分支是最新的）**：✅ 启用
   - **Status checks that are required（必需的状态检查）**：
     - `Test / test`（测试工作流）
     - 其他必需的状态检查（根据实际情况添加）

3. **Require conversation resolution before merging（合并前需要解决对话）**
   - ✅ 启用

4. **Do not allow bypassing the above settings（不允许绕过上述设置）**
   - ✅ 启用（包括管理员）

##### ⚠️ 可选规则

5. **Require linear history（要求线性历史）**
   - ⚠️ 可选：如果团队使用 rebase 策略，可以启用

6. **Require signed commits（要求签名提交）**
   - ⚠️ 可选：提高安全性，但需要团队成员配置 GPG 密钥

7. **Require deployments to succeed before merging（合并前要求部署成功）**
   - ⚠️ 可选：如果需要在合并前验证部署

8. **Lock branch（锁定分支）**
   - ⚠️ 可选：防止直接推送，强制使用 PR

#### 规则摘要

```
✅ Require pull request reviews before merging
   - Required approvals: 1
   - Dismiss stale reviews: ✅
   - Require review from Code Owners: ✅

✅ Require status checks to pass before merging
   - Require branches to be up to date: ✅
   - Required status checks:
     - Test / test

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
   - Include administrators: ✅
```

### 4. 配置其他重要分支（可选）

如果项目有其他重要分支（如 `develop`、`release/*`），也可以为它们配置类似的保护规则。

## 🎯 配置效果

配置完成后，当有人尝试合并 PR 到 `main` 分支时：

1. ✅ **必须通过所有 CI 检查**（类型检查、代码检查、测试）
2. ✅ **必须至少 1 个审批**
3. ✅ **CODEOWNERS 指定的审查者必须审批**（如果配置了 CODEOWNERS）
4. ✅ **所有 PR 评论必须解决**
5. ✅ **分支必须是最新的**（需要 rebase 或 merge upstream）
6. ✅ **管理员也无法绕过这些规则**

## 📝 注意事项

### 状态检查名称

确保工作流中的 job 名称与分支保护规则中配置的状态检查名称一致：

- 工作流文件：`.github/workflows/test.yml`
- Job 名称：`test`（第 40 行）
- 状态检查名称：`Test / test`（格式：`工作流名称 / job名称`）

### CODEOWNERS 文件

如果启用了 "Require review from Code Owners"，确保：

1. `.github/CODEOWNERS` 文件已创建
2. CODEOWNERS 文件中指定的用户/团队有仓库访问权限
3. 至少有一个 CODEOWNERS 规则匹配 PR 中的文件

### 首次配置

首次配置分支保护规则时，建议：

1. 先测试：创建一个测试 PR，验证规则是否生效
2. 通知团队：告知团队成员新的工作流程
3. 文档更新：更新项目文档，说明 PR 流程

## 🔧 故障排除

### 问题：状态检查不显示

**原因**：工作流尚未运行或 job 名称不匹配

**解决方案**：
1. 确保工作流文件已提交到仓库
2. 创建一个测试 PR，触发工作流运行
3. 检查工作流中的 job 名称是否与分支保护规则中的名称一致

### 问题：CODEOWNERS 审查不生效

**原因**：CODEOWNERS 文件格式错误或用户无权限

**解决方案**：
1. 检查 `.github/CODEOWNERS` 文件语法是否正确
2. 确保 CODEOWNERS 中指定的用户/团队有仓库访问权限
3. 验证 CODEOWNERS 规则是否匹配 PR 中的文件路径

### 问题：无法合并 PR

**原因**：未满足分支保护规则要求

**解决方案**：
1. 检查 PR 是否通过所有必需的状态检查
2. 确保有足够的审批（包括 CODEOWNERS 审批）
3. 解决所有 PR 评论
4. 确保分支是最新的（rebase 或 merge upstream）

## 📚 参考资源

- [GitHub 分支保护规则文档](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CODEOWNERS 文件文档](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Actions 状态检查文档](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/about-workflow-runs)
