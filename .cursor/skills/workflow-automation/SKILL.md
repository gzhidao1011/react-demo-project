---
name: workflow-automation
description: Automate development workflows including pre-commit hooks, automated testing, and CI/CD pipelines. Use when automating repetitive tasks or setting up workflow automation.
---

# Workflow Automation

Automate development workflows.

## Quick Checklist

When automating workflows:

- [ ] **Pre-commit hooks** configured
- [ ] **Automated testing** set up
- [ ] **CI/CD pipelines** configured
- [ ] **Automated deployments** set up
- [ ] **Notification system** configured
- [ ] **Workflow monitoring** enabled

## Pre-commit Hooks

### 1. Husky Setup

```bash
# Install Husky
pnpm add -D husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"
```

### 2. Lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write",
      "biome check --apply"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## Automated Testing

### 1. Test on Commit

```bash
# .husky/pre-commit
#!/bin/sh
pnpm test --changed
pnpm check:types
```

## CI/CD Automation

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm test
      - run: pnpm check
```

## Best Practices

### ✅ Good Practices

- Automate repetitive tasks
- Run checks before commit
- Automate testing
- Use CI/CD pipelines
- Monitor workflow success
- Notify on failures

### ❌ Anti-Patterns

- Don't skip automation
- Don't ignore failures
- Don't skip testing
- Don't forget notifications

## Related Rules

- CI/CD Configuration: `.cursor/skills/ci-cd-configuration/SKILL.md`
- Git Operations: `.cursor/skills/git-operations/SKILL.md`
