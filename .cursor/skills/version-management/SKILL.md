---
name: version-management
description: Manage version numbers including semantic versioning, changelog generation, and release management. Use when versioning packages or managing releases.
---

# Version Management

Manage version numbers and releases.

## Quick Checklist

When managing versions:

- [ ] **Semantic versioning** followed
- [ ] **Version numbers** updated
- [ ] **Changelog** generated
- [ ] **Git tags** created
- [ ] **Release notes** prepared
- [ ] **Version consistency** maintained

## Semantic Versioning

### 1. Version Format

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

### 2. Version Bump Script

```bash
#!/bin/bash
# scripts/bump-version.sh

VERSION_TYPE="${1:-patch}" # major, minor, patch

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Bump version
npm version "$VERSION_TYPE" --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

echo "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
```

## Changelog Generation

### 1. Generate Changelog

```bash
# Install changelog generator
pnpm add -D conventional-changelog-cli

# Generate changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

### 2. Changelog Format

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New feature X
- New feature Y

### Changed
- Improved performance

### Fixed
- Bug fix Z

## [1.1.0] - 2024-01-01
...
```

## Release Management

### 1. Release Script

```bash
#!/bin/bash
# scripts/release.sh

VERSION_TYPE="${1:-patch}"

# Run tests
pnpm test

# Bump version
./scripts/bump-version.sh "$VERSION_TYPE"

# Generate changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Create git tag
VERSION=$(node -p "require('./package.json').version")
git add package.json CHANGELOG.md
git commit -m "chore: release v${VERSION}"
git tag "v${VERSION}"
git push origin main --tags
```

## Best Practices

### ✅ Good Practices

- Follow semantic versioning
- Generate changelogs automatically
- Tag releases in Git
- Document breaking changes
- Keep versions consistent
- Use version ranges appropriately

### ❌ Anti-Patterns

- Don't skip version updates
- Don't ignore changelog
- Don't use inconsistent versions
- Don't forget to tag releases

## Related Rules

- Git Commit: `.cursor/rules/08-Git提交规范.mdc`
- Deployment: `.cursor/rules/12-部署与发布规范.mdc`
