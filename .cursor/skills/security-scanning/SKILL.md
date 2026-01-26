---
name: security-scanning
description: Perform security scanning including dependency scanning, SAST, DAST, and container scanning. Use when scanning for vulnerabilities or performing security audits.
---

# Security Scanning

Perform security scanning.

## Quick Checklist

When scanning:

- [ ] **Scanning** tool selected
- [ ] **Dependencies** scanned
- [ ] **Code** scanned
- [ ] **Containers** scanned
- [ ] **Vulnerabilities** fixed

## Security Scanning

### 1. Dependency Scanning

```bash
# Scan dependencies
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

### 2. Code Scanning

```bash
# SAST scanning
npx eslint --ext .ts,.tsx src/

# Security linting
npx eslint-plugin-security src/
```

## Best Practices

### ✅ Good Practices

- Scan regularly
- Fix vulnerabilities
- Use multiple tools
- Integrate in CI
- Track findings

### ❌ Anti-Patterns

- Don't skip scanning
- Don't ignore vulnerabilities
- Don't use single tool

## Related Rules

- Security Audit: `.cursor/skills/security-audit/SKILL.md`
