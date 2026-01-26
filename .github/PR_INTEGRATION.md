# PR 集成功能说明

本文档说明项目中已集成的 Pull Request 相关功能和使用方法。

## ✅ 已集成的功能

### 1. PR 模板

**文件**: `.github/PULL_REQUEST_TEMPLATE.md`

**功能**：
- 创建 PR 时自动填充模板
- 规范 PR 描述格式
- 包含变更类型、影响范围、测试清单等

**使用方法**：
创建 PR 时，GitHub 会自动使用模板，只需填写相应内容即可。

### 2. CODEOWNERS

**文件**: `.github/CODEOWNERS`

**功能**：
- 自动分配代码审查者
- 根据文件路径匹配审查者
- 确保重要代码变更得到适当审查

**配置说明**：
1. 打开 `.github/CODEOWNERS` 文件
2. 将 `@your-username` 替换为实际的 GitHub 用户名或团队名
3. 根据需要调整路径规则

**示例**：
```codeowners
# 前端应用
apps/web/ @frontend-team
apps/docs/ @frontend-team

# 后端服务
services/user-service/ @backend-team
services/order-service/ @backend-team
```

### 3. Codecov 覆盖率集成

**文件**: `.github/workflows/test.yml`

**功能**：
- 在 PR 中显示代码覆盖率
- 显示覆盖率变化
- 覆盖率评论和徽章

**配置步骤**：
1. 参考 `.github/CODECOV_SETUP.md` 完成 Codecov 配置
2. 添加 `CODECOV_TOKEN` 到 GitHub Secrets
3. 工作流会自动上传覆盖率报告

### 4. CI/CD 工作流

**文件**: `.github/workflows/test.yml`

**功能**：
- PR 触发自动测试
- 类型检查、代码检查、测试执行
- 覆盖率报告生成和上传

**触发条件**：
- 所有分支的 PR
- 推送到所有分支（特定路径）
- 手动触发

## 📋 使用流程

### 创建 PR 的标准流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **进行代码变更**
   - 编写代码
   - 运行本地检查：`pnpm check`
   - 运行测试：`pnpm test`

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   git push origin feature/your-feature-name
   ```

4. **创建 PR**
   - 在 GitHub 上创建 PR
   - PR 模板会自动填充
   - 填写变更描述和相关信息

5. **等待 CI 检查**
   - CI 会自动运行测试和检查
   - Codecov 会显示覆盖率信息
   - CODEOWNERS 指定的审查者会自动分配

6. **代码审查**
   - 审查者会收到通知
   - 审查代码并提出反馈
   - 根据反馈修改代码

7. **合并 PR**
   - 所有检查通过后
   - 获得至少 1 个审批
   - 解决所有评论
   - 合并到主分支

## 🔧 配置检查清单

### 必需配置

- [ ] PR 模板已创建（`.github/PULL_REQUEST_TEMPLATE.md`）
- [ ] CODEOWNERS 已配置（`.github/CODEOWNERS`）
- [ ] 测试工作流支持 PR 触发（`.github/workflows/test.yml`）

### 可选配置

- [ ] Codecov 已配置（参考 `.github/CODECOV_SETUP.md`）
- [ ] 分支保护规则已配置（参考 `.github/BRANCH_PROTECTION.md`）

## 📚 相关文档

- [PR 模板](./PULL_REQUEST_TEMPLATE.md) - PR 模板文件
- [CODEOWNERS](./CODEOWNERS) - 代码审查者配置
- [Codecov 配置指南](./CODECOV_SETUP.md) - Codecov 集成说明
- [分支保护规则](./BRANCH_PROTECTION.md) - 分支保护配置指南

## 🎯 最佳实践

### PR 描述

- ✅ 清晰描述变更目的和内容
- ✅ 关联相关 Issue
- ✅ 提供测试步骤和截图（如适用）
- ✅ 勾选所有适用的变更类型

### 代码审查

- ✅ 及时响应审查请求
- ✅ 提供建设性反馈
- ✅ 关注代码质量和可维护性
- ✅ 确保测试覆盖新功能

### CI/CD

- ✅ 确保所有 CI 检查通过
- ✅ 关注覆盖率变化
- ✅ 修复失败的测试和检查
- ✅ 保持代码库健康

## 🐛 常见问题

### Q: PR 模板未自动填充？

**A**: 确保文件名为 `PULL_REQUEST_TEMPLATE.md` 且位于 `.github/` 目录。

### Q: CODEOWNERS 未生效？

**A**: 
1. 检查文件路径和语法是否正确
2. 确保指定的用户/团队有仓库访问权限
3. 验证 CODEOWNERS 规则是否匹配 PR 中的文件

### Q: Codecov 未显示覆盖率？

**A**: 
1. 检查 `CODECOV_TOKEN` 是否已配置
2. 查看工作流日志中的错误信息
3. 参考 `.github/CODECOV_SETUP.md` 进行故障排除

### Q: CI 检查失败？

**A**: 
1. 查看工作流日志了解失败原因
2. 在本地运行 `pnpm check` 和 `pnpm test` 验证
3. 修复问题后推送新提交

## 📞 获取帮助

如果遇到问题：

1. 查看相关文档（`.github/` 目录下的文档）
2. 检查 GitHub Actions 日志
3. 联系团队负责人或项目维护者
