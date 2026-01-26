---
name: security-audit
description: Perform security audits including sensitive information checks, dependency vulnerability scanning, and code security reviews. Use when reviewing code for security issues, checking for vulnerabilities, or performing security audits.
---

# Security Audit

Perform security audits following project standards: sensitive information checks, dependency scanning, and code security reviews.

## Quick Checklist

When performing security audit, check:

- [ ] **Sensitive Information**: No hardcoded secrets, API keys, passwords
- [ ] **Dependencies**: No known vulnerabilities in dependencies
- [ ] **Input Validation**: All inputs are validated
- [ ] **Authentication**: Proper authentication and authorization
- [ ] **XSS Prevention**: User input is properly escaped
- [ ] **SQL Injection**: Using parameterized queries
- [ ] **Error Handling**: Errors don't leak sensitive information
- [ ] **Logging**: Logs don't contain sensitive information

## Sensitive Information Check

### Check for Hardcoded Secrets

```bash
# Search for common patterns
grep -r "api[_-]key" . --exclude-dir=node_modules
grep -r "password\s*=" . --exclude-dir=node_modules
grep -r "secret" . --exclude-dir=node_modules
grep -r "token\s*=" . --exclude-dir=node_modules

# Check for common secret patterns
grep -r "sk_live_\|sk_test_\|pk_live_\|pk_test_" . --exclude-dir=node_modules
grep -r "AKIA[0-9A-Z]\{16\}" . --exclude-dir=node_modules  # AWS keys
```

### Check Git History

```bash
# Check if secrets were committed
git log --all --full-history --source -- "*secret*" "*password*" "*key*"

# Check specific file history
git log -p --all -- "*.env" "*.config.js"
```

### Files to Check

- `.env` files (should be in `.gitignore`)
- Configuration files (`config/*.json`, `*.config.ts`)
- Environment variable files
- Test files (may contain test credentials)
- Documentation (should not contain real secrets)

### ✅ Correct: Using Environment Variables

```typescript
// ✅ Correct: Read from environment
const apiKey = process.env.VITE_API_KEY;
const dbPassword = process.env.MYSQL_PASSWORD;
```

### ❌ Wrong: Hardcoded Secrets

```typescript
// ❌ Wrong: Hardcoded API key
const apiKey = "sk_live_51abc123def456";

// ❌ Wrong: Hardcoded password
const password = "admin123";
```

## Dependency Security Scan

### npm/pnpm Audit

```bash
# Scan for vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit fix

# Check specific severity
pnpm audit --audit-level=moderate

# Get detailed report
pnpm audit --json > audit-report.json
```

### Check for Outdated Packages

```bash
# Check outdated packages
pnpm outdated

# Update packages (carefully)
pnpm update
```

### Dependabot Configuration

Check `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
```

## Code Security Review

### Input Validation

**Check for**:
- ✅ All user inputs are validated
- ✅ Using Zod or similar validation library
- ✅ Server-side validation (not just client-side)

```typescript
// ✅ Correct: Validate input
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

const data = schema.parse(userInput);
```

```typescript
// ❌ Wrong: No validation
const email = req.body.email; // No validation!
```

### XSS Prevention

**Check for**:
- ✅ React automatically escapes content
- ✅ Using `DOMPurify` for HTML content
- ✅ Not using `dangerouslySetInnerHTML` without sanitization

```tsx
// ✅ Correct: React auto-escapes
<div>{userInput}</div>

// ✅ Correct: Sanitize HTML
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

```tsx
// ❌ Wrong: Unsafe HTML rendering
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### SQL Injection Prevention

**Check for**:
- ✅ Using parameterized queries
- ✅ Using ORM (TypeORM, Prisma, etc.)
- ✅ Not concatenating SQL strings

```typescript
// ✅ Correct: Parameterized query
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

```typescript
// ❌ Wrong: SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

### Authentication & Authorization

**Check for**:
- ✅ Token-based authentication
- ✅ Server-side authorization checks
- ✅ Not relying on client-side only checks

```typescript
// ✅ Correct: Server-side check
if (!user.hasPermission("admin")) {
  throw new Error("Unauthorized");
}
```

```typescript
// ❌ Wrong: Client-side only check
if (user.role === "admin") {
  // Show admin features (insecure!)
}
```

### Error Handling Security

**Check for**:
- ✅ Errors don't leak sensitive information
- ✅ Generic error messages for users
- ✅ Detailed errors only in logs

```typescript
// ✅ Correct: Generic error message
try {
  await login(credentials);
} catch (error) {
  // Generic message for user
  throw new Error("登录失败，请检查用户名和密码");
  // Detailed error in logs
  console.error("Login failed:", error);
}
```

```typescript
// ❌ Wrong: Leak sensitive info
catch (error) {
  throw new Error(`Database error: ${error.message}`); // May leak DB structure
}
```

## Docker Security

### Base Image Security

**Check for**:
- ✅ Using official base images
- ✅ Using specific versions (not `latest`)
- ✅ Regularly updating base images

```dockerfile
# ✅ Correct: Official image with version
FROM node:22-alpine
FROM eclipse-temurin:17-jdk-alpine
```

```dockerfile
# ❌ Wrong: Unmaintained image
FROM some-random-user/node:latest
```

### Container Security

**Check for**:
- ✅ Not running as root user
- ✅ Health checks configured
- ✅ Resource limits set
- ✅ Read-only file system where possible

```dockerfile
# ✅ Correct: Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs
```

## Security Headers

### Nginx Security Headers

Check `apps/*/nginx.conf`:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000" always;
```

## Security Audit Workflow

### 1. Pre-Commit Check

```bash
# Run security checks before commit
pnpm audit
git-secrets --scan  # If installed
```

### 2. Code Review Checklist

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] XSS prevention measures
- [ ] SQL injection prevention
- [ ] Authentication/authorization correct
- [ ] Error handling secure
- [ ] Dependencies up to date

### 3. CI/CD Security Checks

Check `.github/workflows/*.yml` for security steps:

```yaml
- name: Security audit
  run: pnpm audit --audit-level=moderate

- name: Check for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
```

## Common Security Issues

### Issue 1: Hardcoded API Keys

**Problem**: API keys committed to repository

**Solution**:
1. Revoke the exposed key immediately
2. Move to environment variables
3. Add to `.gitignore`
4. Use GitHub Secrets in CI/CD

### Issue 2: Dependency Vulnerabilities

**Problem**: Known vulnerabilities in dependencies

**Solution**:
1. Run `pnpm audit` to identify issues
2. Update vulnerable packages
3. Use `pnpm audit fix` for auto-fixable issues
4. Review breaking changes before updating

### Issue 3: Missing Input Validation

**Problem**: User input not validated

**Solution**:
1. Add Zod schemas for all inputs
2. Validate on both client and server
3. Use type-safe validation

### Issue 4: XSS Vulnerabilities

**Problem**: Unsafe HTML rendering

**Solution**:
1. Use React's automatic escaping
2. Use `DOMPurify` for HTML content
3. Never use `dangerouslySetInnerHTML` with user input

## Best Practices

### ✅ Good Practices

- Use environment variables for secrets
- Regularly update dependencies
- Validate all user inputs
- Use parameterized queries
- Implement proper error handling
- Use security headers
- Regular security audits

### ❌ Anti-Patterns

- Hardcoding secrets
- Ignoring dependency vulnerabilities
- Skipping input validation
- Concatenating SQL strings
- Leaking sensitive info in errors
- Using `latest` Docker tags

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- Code Review: `.cursor/skills/code-review/SKILL.md`
- API Development: `.cursor/skills/api-development/SKILL.md`
