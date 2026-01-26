---
name: pr-workflow
description: Guide through PR creation, review, and merge workflow following project standards. Use when creating pull requests, reviewing PRs, or when the user asks about PR workflow.
---

# PR Workflow

Guide through Pull Request workflow following project standards.

## PR Creation Checklist

Before creating a PR:

- [ ] Code follows project standards (see `.cursor/rules/`)
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm check:types`)
- [ ] Linting passes (`pnpm check`)
- [ ] No console errors or warnings
- [ ] Branch is up to date with main
- [ ] Commit messages follow Conventional Commits

## PR Description Template

Use this structure:

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 测试相关 (test)
- [ ] 其他 (chore)

## 变更描述
[详细描述变更内容和目的]

## 影响范围
[说明影响的功能模块]

## 测试步骤
1. [测试步骤 1]
2. [测试步骤 2]

## 截图（如适用）
[添加截图或 GIF]

## 相关 Issue
关联 #123
```

## PR Review Checklist

When reviewing a PR:

- [ ] Code quality and style
- [ ] Security considerations
- [ ] Test coverage
- [ ] Documentation updates
- [ ] Breaking changes (if any)
- [ ] Performance impact
- [ ] Accessibility

**Use code-review skill for detailed review**.

## Merge Requirements

Before merging:

- [ ] All CI checks pass ✅
- [ ] At least 1 reviewer approved
- [ ] All comments resolved
- [ ] Branch is up to date
- [ ] No merge conflicts

## Merge Strategy

**Recommended**: Squash and merge

- Keeps main branch history clean
- Combines all commits into one
- Uses PR title and description

## Common Workflows

### Creating a PR

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push branch: `git push origin feature/your-feature`
4. Create PR on GitHub
5. Fill PR template
6. Request review from CODEOWNERS

### Updating a PR

1. Make additional commits
2. Push to same branch
3. PR automatically updates
4. CI re-runs automatically

### Resolving Conflicts

1. Update branch: `git checkout feature/your-feature`
2. Merge main: `git merge main` or `git rebase main`
3. Resolve conflicts
4. Commit and push

## Related Rules

- PR Workflow: `.cursor/rules/17-PR工作流程规范.mdc`
- GitHub Collaboration: `.cursor/rules/16-GitHub协作规范.mdc`
- Branch Protection: `.cursor/rules/18-分支保护规范.mdc`
