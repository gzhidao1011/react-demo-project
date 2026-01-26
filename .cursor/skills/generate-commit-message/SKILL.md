---
name: generate-commit-message
description: Generate descriptive commit messages following Conventional Commits standard. Use when the user asks to create a commit message, write commit messages, or when reviewing staged changes for commit.
---

# Generate Commit Message

Generate commit messages following Conventional Commits standard with Chinese descriptions.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Commit Types (English Only)

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test changes
- `perf`: Performance improvements
- `chore`: Build system or auxiliary tools
- `ci`: CI configuration changes
- `build`: Build system or dependencies

**CRITICAL**: Type MUST be in English. Never use Chinese types like "功能" or "修复".

## Scope (Optional, English)

Use package or module name:
- `ui` - UI components
- `utils` - Utility functions
- `api` - API related
- `form` - Form handling
- `auth` - Authentication
- `web` - Web app
- `storybook` - Storybook

## Subject (Chinese, Imperative Mood)

- Use Chinese for description
- Use imperative mood (present tense)
- No period at the end
- Max 50 characters (Chinese counts as 2)

## Examples

### Simple Commit

**Input**: Added user login functionality
**Output**:
```
feat(auth): 添加用户登录功能
```

### With Scope

**Input**: Fixed form validation error handling
**Output**:
```
fix(form): 修复表单验证错误处理问题
```

### With Body

**Input**: Refactored API request handling to use unified error handler
**Output**:
```
refactor(api): 重构 API 请求错误处理

- 统一使用 handleServerError 处理错误
- 添加系统级错误的 Toast 通知
- 优化错误类型判断逻辑
```

### Breaking Change

**Input**: Changed API response structure (breaking change)
**Output**:
```
refactor(api): 重构 API 响应结构

BREAKING CHANGE: API 响应结构已更改。
`data` 字段现在是必需的，而不是可选的。
```

## Analysis Process

1. **Analyze changes**: Review git diff or staged changes
2. **Determine type**: Choose appropriate type (English)
3. **Identify scope**: Find affected package/module (if applicable)
4. **Write subject**: Describe change in Chinese (imperative mood)
5. **Add body**: Provide details if needed (Chinese)
6. **Add footer**: Include breaking changes or issue references if needed

## Common Patterns

### Feature Addition
```
feat(scope): 添加 [功能描述]
```

### Bug Fix
```
fix(scope): 修复 [问题描述]
```

### Refactoring
```
refactor(scope): 重构 [模块/功能]
```

### Documentation
```
docs: 更新 [文档内容]
```

### Test
```
test(scope): 添加 [测试内容]
```

## Rules

- ✅ Type in English: `feat`, `fix`, `refactor`
- ✅ Subject in Chinese: "添加功能", "修复问题"
- ✅ Imperative mood: "添加" not "已添加" or "正在添加"
- ✅ No period at end of subject
- ❌ Never use Chinese types: "功能", "修复", "文档"
- ❌ Never use past tense: "已修复", "已添加"
- ❌ Never use English for subject: "add feature"

## Related Rules

See `.cursor/rules/08-Git提交规范.mdc` for complete specification.
