---
name: dependency-management
description: Manage project dependencies including adding, updating, removing packages, resolving conflicts, and auditing security vulnerabilities. Use when managing dependencies, updating packages, or resolving dependency issues.
---

# Dependency Management

Manage project dependencies following best practices and project standards.

## Quick Checklist

When managing dependencies:

- [ ] **Check** if package is needed
- [ ] **Verify** compatibility with project
- [ ] **Review** security vulnerabilities
- [ ] **Update** lock file
- [ ] **Test** after adding/updating
- [ ] **Document** why package is needed
- [ ] **Remove** unused dependencies

## Adding Dependencies

### 1. Check if Package is Needed

```bash
# Search for existing functionality
grep -r "similar-functionality" .

# Check if workspace package provides it
pnpm list --depth=0
```

### 2. Add to Correct Location

```bash
# Add to root (dev dependency)
pnpm add -Dw <package-name>

# Add to specific package
pnpm --filter @repo/ui add <package-name>

# Add workspace package
pnpm --filter @repo/web add @repo/ui
```

### 3. Verify Installation

```bash
# Check package is installed
pnpm list <package-name>

# Verify in package.json
cat packages/ui/package.json | grep <package-name>
```

## Updating Dependencies

### 1. Check for Updates

```bash
# Check outdated packages
pnpm outdated

# Check specific package
pnpm outdated <package-name>
```

### 2. Update Safely

```bash
# Update patch versions (safe)
pnpm update <package-name> --latest

# Update specific version
pnpm add <package-name>@<version>

# Update all packages (careful!)
pnpm update --latest
```

### 3. Test After Update

```bash
# Run tests
pnpm test

# Check types
pnpm check:types

# Check linting
pnpm check
```

## Removing Dependencies

### 1. Identify Unused Dependencies

```bash
# Check if package is used
grep -r "package-name" .

# Use depcheck (if installed)
npx depcheck
```

### 2. Remove Dependency

```bash
# Remove from specific package
pnpm --filter @repo/ui remove <package-name>

# Remove from root
pnpm remove <package-name>
```

### 3. Clean Up

```bash
# Remove from lock file (automatic)
# Verify removal
pnpm list <package-name> # Should show "not found"
```

## Security Auditing

### 1. Audit Dependencies

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit fix

# Check specific severity
pnpm audit --audit-level=moderate
```

### 2. Review Vulnerabilities

```bash
# Get detailed report
pnpm audit --json > audit-report.json

# Review each vulnerability
# Check if it affects your code
# Update or remove if necessary
```

## Dependency Conflicts

### 1. Identify Conflicts

```bash
# Check for peer dependency warnings
pnpm install

# Check dependency tree
pnpm list --depth=3
```

### 2. Resolve Conflicts

```bash
# Use resolutions in package.json
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}

# Or use peerDependencies
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

## Monorepo Dependency Management

### 1. Workspace Dependencies

```bash
# Add workspace package
pnpm --filter @repo/web add @repo/ui

# Use workspace protocol
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

### 2. Shared Dependencies

```bash
# Add to root (shared)
pnpm add -Dw <package-name>

# Use in packages
# No need to add again, available from root
```

### 3. Package-Specific Dependencies

```bash
# Add only to specific package
pnpm --filter @repo/ui add <package-name>

# Other packages won't have it
```

## Best Practices

### ✅ Good Practices

- Add dependencies only when needed
- Keep dependencies up-to-date
- Review security vulnerabilities regularly
- Remove unused dependencies
- Document why package is needed
- Test after adding/updating
- Use workspace packages when possible
- Lock dependency versions in production

### ❌ Anti-Patterns

- Don't add dependencies without checking alternatives
- Don't ignore security vulnerabilities
- Don't leave unused dependencies
- Don't update all packages at once without testing
- Don't use `latest` tag in production
- Don't ignore peer dependency warnings

## Dependency Types

### 1. Production Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 2. Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 3. Peer Dependencies

```json
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### 4. Optional Dependencies

```json
{
  "optionalDependencies": {
    "optional-package": "^1.0.0"
  }
}
```

## Version Management

### 1. Version Ranges

```json
{
  "dependencies": {
    "exact": "1.0.0",           // Exact version
    "caret": "^1.0.0",          // Compatible versions (1.x.x)
    "tilde": "~1.0.0",          // Patch versions (1.0.x)
    "range": ">=1.0.0 <2.0.0",  // Version range
    "latest": "*"               // Latest (not recommended)
  }
}
```

### 2. Lock File

```bash
# Lock file ensures consistent installs
# pnpm-lock.yaml is automatically updated

# Commit lock file
git add pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

## Troubleshooting

### Issue 1: Installation Fails

```bash
# Clear cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Issue 2: Version Conflicts

```bash
# Check conflicting packages
pnpm list --depth=3

# Use resolutions to force version
{
  "pnpm": {
    "overrides": {
      "conflicting-package": "^1.0.0"
    }
  }
}
```

### Issue 3: Peer Dependency Warnings

```bash
# Install peer dependencies
pnpm add <peer-dependency>

# Or mark as optional (if truly optional)
{
  "peerDependencies": {
    "optional-peer": "*"
  },
  "peerDependenciesMeta": {
    "optional-peer": {
      "optional": true
    }
  }
}
```

## Related Rules

- Security Audit: `.cursor/skills/security-audit/SKILL.md`
- Monorepo Operations: `.cursor/skills/monorepo-operations/SKILL.md`
