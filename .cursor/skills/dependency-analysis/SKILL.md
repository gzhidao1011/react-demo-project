---
name: dependency-analysis
description: Analyze project dependencies including security vulnerabilities, outdated packages, unused dependencies, and dependency conflicts. Use when auditing dependencies or managing package updates.
---

# Dependency Analysis

Analyze and manage project dependencies.

## Quick Checklist

When analyzing dependencies:

- [ ] **Security audit** performed
- [ ] **Outdated packages** identified
- [ ] **Unused dependencies** found
- [ ] **Version conflicts** resolved
- [ ] **License compliance** checked
- [ ] **Bundle impact** analyzed

## Security Audit

### 1. Run Security Audit

```bash
# Audit dependencies for vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit --fix

# Generate audit report
pnpm audit --json > audit-report.json
```

### 2. Check Outdated Packages

```bash
# Check outdated packages
pnpm outdated

# Update packages interactively
pnpm update-interactive
```

## Dependency Analysis Tools

### 1. Analyze Dependencies

```bash
# Install analysis tool
pnpm add -D depcheck

# Find unused dependencies
npx depcheck

# Find unused dev dependencies
npx depcheck --dev
```

### 2. License Check

```bash
# Install license checker
pnpm add -D license-checker

# Check licenses
npx license-checker --summary
```

## Best Practices

### ✅ Good Practices

- Regular security audits
- Keep dependencies updated
- Remove unused dependencies
- Check license compatibility
- Monitor dependency size
- Use exact versions in production

### ❌ Anti-Patterns

- Don't ignore security warnings
- Don't skip dependency updates
- Don't keep unused dependencies
- Don't ignore license issues

## Related Rules

- Security Audit: `.cursor/skills/security-audit/SKILL.md`
- Dependency Management: `.cursor/skills/dependency-management/SKILL.md`
