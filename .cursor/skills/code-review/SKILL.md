---
name: code-review
description: Review code for quality, security, and maintainability following project standards. Use when reviewing pull requests, examining code changes, or when the user asks for a code review.
---

# Code Review

Review code changes following project standards and best practices.

## Quick Checklist

When reviewing code, check:

- [ ] **Correctness**: Logic is correct and handles edge cases
- [ ] **Security**: No security vulnerabilities (SQL injection, XSS, sensitive data exposure)
- [ ] **Code Style**: Follows project conventions (see `.cursor/rules/`)
- [ ] **TypeScript**: Proper types, no `any` unless necessary
- [ ] **Error Handling**: Comprehensive error handling
- [ ] **Tests**: Tests cover the changes
- [ ] **Performance**: No obvious performance issues
- [ ] **Accessibility**: ARIA attributes and semantic HTML where needed

## Review Focus Areas

### 1. Code Quality

**Check for**:
- Functions are appropriately sized and focused (single responsibility)
- No code duplication
- Proper use of React hooks (no violations)
- Clean code principles followed

**Common Issues**:
- ❌ Functions doing too much
- ❌ Magic numbers/strings (use constants)
- ❌ Unnecessary complexity

### 2. TypeScript

**Check for**:
- Proper type definitions
- No `any` types (unless absolutely necessary)
- Type inference used correctly
- Generic types used appropriately

**Reference**: `.cursor/rules/03-TypeScript指南.mdc`

### 3. Security

**Check for**:
- No hardcoded secrets or API keys
- Input validation (especially for forms)
- XSS prevention (proper escaping)
- SQL injection prevention (if applicable)
- Authentication/authorization checks

**Reference**: `.cursor/rules/21-安全规范.mdc`

### 4. Form Handling

**Check for**:
- Uses React Hook Form + Zod (not manual state)
- Proper error handling with `handleServerError`
- Toast notifications for success/system errors
- Inline errors for field-level errors
- ARIA attributes for accessibility

**Reference**: 
- `.cursor/rules/09-表单验证.mdc`
- `.cursor/rules/10-表单错误处理.mdc`

### 5. Component Structure

**Check for**:
- Follows FSD architecture (if applicable)
- Proper file organization
- Component props properly typed
- Proper use of hooks and composables

**Reference**: `.cursor/rules/05-代码组织.mdc`

### 6. Styling

**Check for**:
- Uses Tailwind CSS (not custom CSS unless necessary)
- Uses CSS variables for theming
- Supports dark mode
- Responsive design

**Reference**: `.cursor/rules/07-设计系统.mdc`

### 7. Testing

**Check for**:
- Tests cover new functionality
- Tests are meaningful (not just coverage)
- Edge cases tested
- Proper test structure (AAA pattern)

**Reference**: `.cursor/rules/20-测试与覆盖率规范.mdc`

## Providing Feedback

Format feedback using emoji indicators:

- 🔴 **Critical**: Must fix before merge (security, bugs, breaking changes)
- 🟡 **Suggestion**: Consider improving (code quality, performance)
- 🟢 **Nice to have**: Optional enhancement (refactoring, documentation)

**Example feedback**:
```
🔴 Critical: Missing input validation on email field. Use Zod schema.

🟡 Suggestion: Extract this logic into a custom hook for reusability.

🟢 Nice to have: Add JSDoc comment explaining the complex algorithm.
```

## Monorepo Considerations

When reviewing code in a monorepo:

- [ ] Changes don't break other packages
- [ ] Package dependencies are correct
- [ ] Turborepo tasks are properly configured
- [ ] Cross-package imports follow conventions

## Common Patterns to Enforce

### ✅ Good Patterns

```typescript
// Proper error handling
try {
  await apiCall();
  toast.success("操作成功");
} catch (error) {
  const result = handleServerError(error, setError);
  if (result.shouldShowToast) {
    toast.error(result.toastMessage);
  }
}

// Proper form validation
const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### ❌ Anti-Patterns

```typescript
// ❌ Manual form state
const [email, setEmail] = useState("");

// ❌ Hardcoded values
const apiKey = "sk_live_123456";

// ❌ Missing error handling
await apiCall(); // No try/catch

// ❌ Using any
const data: any = fetchData();
```

## Review Workflow

1. **Read the PR description** - Understand the context
2. **Check the diff** - Review all changes
3. **Run tests locally** (if possible) - Verify functionality
4. **Check CI/CD status** - Ensure all checks pass
5. **Provide structured feedback** - Use emoji indicators
6. **Approve or request changes** - Based on severity

## Related Rules

- Code Style: `.cursor/rules/01-代码风格.mdc`
- TypeScript: `.cursor/rules/03-TypeScript指南.mdc`
- Form Handling: `.cursor/rules/09-表单验证.mdc`, `.cursor/rules/10-表单错误处理.mdc`
- Security: `.cursor/rules/21-安全规范.mdc`
- Testing: `.cursor/rules/20-测试与覆盖率规范.mdc`
