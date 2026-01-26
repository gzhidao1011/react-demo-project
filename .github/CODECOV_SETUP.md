# Codecov 集成配置指南

本文档说明如何配置 Codecov 以在 PR 中显示代码覆盖率报告。

## 📋 配置步骤

### 1. 注册 Codecov 账户

1. 访问 [Codecov](https://codecov.io/)
2. 使用 GitHub 账户登录
3. 授权 Codecov 访问你的 GitHub 仓库

### 2. 添加仓库到 Codecov

1. 登录 Codecov 后，点击 **Add new repository**
2. 选择你的 GitHub 仓库
3. Codecov 会自动生成一个 **Repository Upload Token**

### 3. 配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 Secret：

   **Name**: `CODECOV_TOKEN`
   
   **Value**: 从 Codecov 获取的 Repository Upload Token

### 4. 验证配置

配置完成后，当 PR 或 push 触发测试工作流时：

1. ✅ 测试工作流会自动生成覆盖率报告
2. ✅ 覆盖率报告会自动上传到 Codecov
3. ✅ Codecov 会在 PR 中显示覆盖率变化和评论

## 🎯 Codecov 功能

### PR 中的覆盖率显示

- **覆盖率徽章**：显示当前覆盖率百分比
- **覆盖率变化**：显示 PR 相对于主分支的覆盖率变化
- **文件级覆盖率**：显示每个文件的覆盖率详情
- **覆盖率评论**：Codecov bot 会在 PR 中自动评论覆盖率信息

### 覆盖率阈值

可以在 Codecov 中配置覆盖率阈值：

- **最小覆盖率要求**：例如要求覆盖率不低于 80%
- **覆盖率下降警告**：如果 PR 导致覆盖率下降，会显示警告
- **覆盖率目标**：设置覆盖率目标，跟踪进度

## 📝 配置文件（可选）

如果需要自定义 Codecov 行为，可以在项目根目录创建 `codecov.yml`：

```yaml
codecov:
  token: # 通常不需要，使用 GitHub Secret
  notify:
    wait_for_ci: true
  comment:
    layout: "reach,diff,flags,tree"
    behavior: default
  coverage:
    precision: 2
    round: down
    range: "70...100"
  flags:
    unittests:
      paths:
        - packages/utils/
        - packages/services/
```

## 🔧 故障排除

### 问题：Codecov 未在 PR 中显示

**可能原因**：
1. `CODECOV_TOKEN` Secret 未配置或配置错误
2. 覆盖率文件路径不正确
3. Codecov 服务暂时不可用

**解决方案**：
1. 检查 GitHub Secrets 中是否配置了 `CODECOV_TOKEN`
2. 检查工作流日志中的 "Upload coverage to Codecov" 步骤是否有错误
3. 确认覆盖率文件路径是否正确（`**/coverage/lcov.info`）

### 问题：覆盖率报告格式不正确

**可能原因**：测试工具未生成 Codecov 支持的格式

**解决方案**：
1. 确保测试工具生成 `lcov.info` 或 `coverage-final.json` 格式
2. 检查测试配置文件（如 `vitest.config.ts`）中的覆盖率配置

### 问题：Codecov 评论未显示

**可能原因**：Codecov bot 权限不足

**解决方案**：
1. 在 Codecov 设置中检查 bot 权限
2. 确保 Codecov GitHub App 已安装并授权

## 📚 参考资源

- [Codecov 官方文档](https://docs.codecov.com/)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)
- [Codecov 配置示例](https://docs.codecov.com/docs/codecov-yaml)

## ✅ 验证清单

配置完成后，请验证：

- [ ] Codecov 账户已创建并登录
- [ ] 仓库已添加到 Codecov
- [ ] `CODECOV_TOKEN` 已添加到 GitHub Secrets
- [ ] 测试工作流已更新（包含 Codecov 上传步骤）
- [ ] 创建测试 PR 验证 Codecov 是否正常工作
